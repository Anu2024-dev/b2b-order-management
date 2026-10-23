import { query, getClient } from '../config/db.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';
import { logEvent } from './audit.service.js';

const ALLOWED_SORT_FIELDS = ['name', 'unit_price', 'created_at', 'stock_quantity'];

export const listProducts = async ({
  page = 1,
  limit = 12,
  search,
  category,
  sort = 'created_at',
  order = 'desc',
  minPrice,
  maxPrice,
  isActive,
  role = 'customer',
}) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  // Customers can only view active products
  if (role !== 'admin') {
    whereClauses.push('p.is_active = true');
  } else if (isActive !== undefined) {
    params.push(isActive);
    whereClauses.push(`p.is_active = $${params.length}`);
  }

  if (search) {
    params.push(`%${search.trim()}%`);
    const searchIdx = params.length;
    whereClauses.push(`(p.name ILIKE $${searchIdx} OR p.sku ILIKE $${searchIdx} OR p.description ILIKE $${searchIdx})`);
  }

  if (category) {
    params.push(category);
    whereClauses.push(`c.name = $${params.length}`);
  }

  if (minPrice !== undefined) {
    params.push(minPrice);
    whereClauses.push(`p.unit_price >= $${params.length}`);
  }

  if (maxPrice !== undefined) {
    params.push(maxPrice);
    whereClauses.push(`p.unit_price <= $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Sort validation against explicit allowlist
  const validSort = ALLOWED_SORT_FIELDS.includes(sort) ? `p.${sort}` : 'p.created_at';
  const validOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const countSql = `
    SELECT COUNT(*) 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereSql};
  `;
  const countRes = await query(countSql, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit);
  const limitParam = `$${params.length}`;
  params.push(offset);
  const offsetParam = `$${params.length}`;

  const sql = `
    SELECT 
      p.id,
      p.sku,
      p.name,
      p.description,
      p.unit_price,
      p.currency,
      p.stock_quantity,
      p.is_active,
      p.created_at,
      p.updated_at,
      c.id as category_id,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereSql}
    ORDER BY ${validSort} ${validOrder}
    LIMIT ${limitParam} OFFSET ${offsetParam};
  `;

  const productsRes = await query(sql, params);

  return {
    products: productsRes.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = async (id, role = 'customer') => {
  const sql = `
    SELECT 
      p.id,
      p.sku,
      p.name,
      p.description,
      p.unit_price,
      p.currency,
      p.stock_quantity,
      p.is_active,
      p.created_at,
      p.updated_at,
      c.id as category_id,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = $1;
  `;
  const res = await query(sql, [id]);
  if (res.rows.length === 0) {
    throw new NotFoundError('Product not found');
  }

  const product = res.rows[0];
  if (role !== 'admin' && !product.is_active) {
    throw new NotFoundError('Product is currently inactive');
  }

  return product;
};

export const createProduct = async (
  { sku, name, description, categoryId, unitPrice, stockQuantity, isActive = true },
  actorId,
  ipAddress
) => {
  const normSku = sku.trim().toUpperCase();

  const dup = await query('SELECT id FROM products WHERE UPPER(sku) = $1;', [normSku]);
  if (dup.rows.length > 0) {
    throw new ConflictError(`Product with SKU '${normSku}' already exists`);
  }

  const catCheck = await query('SELECT id FROM categories WHERE id = $1;', [categoryId]);
  if (catCheck.rows.length === 0) {
    throw new BadRequestError('Invalid category ID');
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const insertSql = `
      INSERT INTO products (sku, name, description, category_id, unit_price, currency, stock_quantity, is_active)
      VALUES ($1, $2, $3, $4, $5, 'INR', $6, $7)
      RETURNING *;
    `;
    const prodRes = await client.query(insertSql, [
      normSku,
      name.trim(),
      description || null,
      categoryId,
      unitPrice,
      stockQuantity,
      isActive,
    ]);
    const product = prodRes.rows[0];

    // Record initial inventory movement
    await client.query(
      `INSERT INTO inventory_movements (product_id, change_quantity, balance_after, reason, reference_id, actor_id)
       VALUES ($1, $2, $2, 'INITIAL_SETUP', 'ADMIN_CREATE', $3);`,
      [product.id, stockQuantity, actorId]
    );

    await logEvent({
      actorId,
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: product.id,
      metadata: { sku: product.sku, name: product.name, unitPrice, stockQuantity },
      ipAddress,
      client,
    });

    await client.query('COMMIT');
    return product;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const updateProduct = async (id, data, actorId, ipAddress) => {
  const existing = await query('SELECT * FROM products WHERE id = $1;', [id]);
  if (existing.rows.length === 0) {
    throw new NotFoundError('Product not found');
  }
  const current = existing.rows[0];

  if (data.categoryId) {
    const catCheck = await query('SELECT id FROM categories WHERE id = $1;', [data.categoryId]);
    if (catCheck.rows.length === 0) {
      throw new BadRequestError('Invalid category ID');
    }
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const fields = [];
    const params = [];

    if (data.name !== undefined) {
      params.push(data.name.trim());
      fields.push(`name = $${params.length}`);
    }
    if (data.description !== undefined) {
      params.push(data.description);
      fields.push(`description = $${params.length}`);
    }
    if (data.categoryId !== undefined) {
      params.push(data.categoryId);
      fields.push(`category_id = $${params.length}`);
    }
    if (data.unitPrice !== undefined) {
      params.push(data.unitPrice);
      fields.push(`unit_price = $${params.length}`);
    }
    if (data.isActive !== undefined) {
      params.push(data.isActive);
      fields.push(`is_active = $${params.length}`);
    }

    // If stockQuantity is explicitly altered directly in updateProduct, track movement
    let stockChanged = false;
    let qtyDiff = 0;
    if (data.stockQuantity !== undefined && data.stockQuantity !== current.stock_quantity) {
      stockChanged = true;
      qtyDiff = data.stockQuantity - current.stock_quantity;
      params.push(data.stockQuantity);
      fields.push(`stock_quantity = $${params.length}`);
    }

    params.push(new Date());
    fields.push(`updated_at = $${params.length}`);

    params.push(id);
    const updateSql = `
      UPDATE products
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING *;
    `;

    const res = await client.query(updateSql, params);
    const updated = res.rows[0];

    if (stockChanged) {
      await client.query(
        `INSERT INTO inventory_movements (product_id, change_quantity, balance_after, reason, reference_id, actor_id)
         VALUES ($1, $2, $3, 'PRODUCT_EDIT_STOCK', 'MANUAL_OVERWRITE', $4);`,
        [id, qtyDiff, updated.stock_quantity, actorId]
      );
    }

    await logEvent({
      actorId,
      action: 'PRODUCT_UPDATED',
      entityType: 'PRODUCT',
      entityId: id,
      metadata: data,
      ipAddress,
      client,
    });

    await client.query('COMMIT');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const toggleProductStatus = async (id, isActive, actorId, ipAddress) => {
  const res = await query(
    `UPDATE products 
     SET is_active = $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING id, sku, name, is_active, updated_at;`,
    [isActive, id]
  );
  if (res.rows.length === 0) {
    throw new NotFoundError('Product not found');
  }

  const updated = res.rows[0];

  await logEvent({
    actorId,
    action: isActive ? 'PRODUCT_ACTIVATED' : 'PRODUCT_DEACTIVATED',
    entityType: 'PRODUCT',
    entityId: id,
    metadata: { isActive },
    ipAddress,
  });

  return updated;
};

export default {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
};
