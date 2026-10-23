import { query, getClient } from '../config/db.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { logEvent } from './audit.service.js';

export const adjustStock = async ({
  productId,
  changeQuantity,
  reason,
  referenceId,
  actorId,
  ipAddress,
}) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Row-level lock to prevent concurrent race conditions
    const prodRes = await client.query(
      'SELECT id, sku, name, stock_quantity, is_active FROM products WHERE id = $1 FOR UPDATE;',
      [productId]
    );

    if (prodRes.rows.length === 0) {
      throw new NotFoundError('Product not found');
    }

    const product = prodRes.rows[0];
    const newStock = product.stock_quantity + changeQuantity;

    if (newStock < 0) {
      throw new BadRequestError(
        `Insufficient inventory to deduct ${Math.abs(changeQuantity)} units. Current stock is ${product.stock_quantity}.`
      );
    }

    await client.query(
      'UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2;',
      [newStock, productId]
    );

    const movRes = await client.query(
      `INSERT INTO inventory_movements 
       (product_id, change_quantity, balance_after, reason, reference_id, actor_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [productId, changeQuantity, newStock, reason, referenceId || 'ADMIN_ADJUSTMENT', actorId]
    );

    await logEvent({
      actorId,
      action: 'INVENTORY_ADJUSTED',
      entityType: 'PRODUCT',
      entityId: productId,
      metadata: {
        sku: product.sku,
        name: product.name,
        previousStock: product.stock_quantity,
        changeQuantity,
        newStock,
        reason,
        referenceId,
      },
      ipAddress,
      client,
    });

    await client.query('COMMIT');
    return {
      movement: movRes.rows[0],
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        previousStock: product.stock_quantity,
        currentStock: newStock,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const listMovements = async ({ productId, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  if (productId) {
    params.push(productId);
    whereClauses.push(`m.product_id = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRes = await query(
    `SELECT COUNT(*) FROM inventory_movements m ${whereSql};`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit);
  const limitParam = `$${params.length}`;
  params.push(offset);
  const offsetParam = `$${params.length}`;

  const sql = `
    SELECT 
      m.id,
      m.product_id,
      p.sku as product_sku,
      p.name as product_name,
      m.change_quantity,
      m.balance_after,
      m.reason,
      m.reference_id,
      m.actor_id,
      u.name as actor_name,
      m.created_at
    FROM inventory_movements m
    JOIN products p ON m.product_id = p.id
    LEFT JOIN users u ON m.actor_id = u.id
    ${whereSql}
    ORDER BY m.created_at DESC
    LIMIT ${limitParam} OFFSET ${offsetParam};
  `;

  const res = await query(sql, params);

  return {
    movements: res.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export default {
  adjustStock,
  listMovements,
};
