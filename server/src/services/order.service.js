import crypto from 'crypto';
import { query, getClient } from '../config/db.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { logEvent } from './audit.service.js';

// Status transition matrix
const ALLOWED_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export const createOrderFromCart = async (userId, { shippingAddress, notes, ipAddress }) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Fetch user's cart
    const cartRes = await client.query('SELECT id FROM carts WHERE user_id = $1;', [userId]);
    if (cartRes.rows.length === 0) {
      throw new BadRequestError('Cart is empty. Please add products before placing an order.');
    }
    const cartId = cartRes.rows[0].id;

    // 2. Fetch cart items
    const cartItemsRes = await client.query(
      `SELECT ci.product_id, ci.quantity 
       FROM cart_items ci 
       WHERE ci.cart_id = $1 
       ORDER BY ci.product_id ASC;`,
      [cartId]
    );

    if (cartItemsRes.rows.length === 0) {
      throw new BadRequestError('Cannot place order: Cart is empty.');
    }

    // 3. Lock products using SELECT ... FOR UPDATE to avoid overselling / race conditions
    const productIds = cartItemsRes.rows.map((r) => r.product_id);
    const lockedProductsRes = await client.query(
      `SELECT id, sku, name, unit_price, stock_quantity, is_active 
       FROM products 
       WHERE id = ANY($1) 
       FOR UPDATE;`,
      [productIds]
    );

    const productMap = new Map();
    lockedProductsRes.rows.forEach((p) => productMap.set(p.id, p));

    // 4. Validate all items and compute totals
    let subtotal = 0;
    const orderItemsToInsert = [];

    for (const item of cartItemsRes.rows) {
      const product = productMap.get(item.product_id);

      if (!product) {
        throw new BadRequestError(`Product (ID: ${item.product_id}) no longer exists.`);
      }

      if (!product.is_active) {
        throw new BadRequestError(`Product "${product.name}" (${product.sku}) is currently inactive and cannot be ordered.`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${product.stock_quantity}.`
        );
      }

      const unitPrice = Number(product.unit_price);
      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
      subtotal += lineTotal;

      orderItemsToInsert.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
        currentStock: product.stock_quantity,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const taxRate = 0.18; // 18% GST
    const taxAmount = Number((subtotal * taxRate).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    // 5. Generate unique order number (e.g. ORD-20261023-XXXX)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `ORD-${today}-${randomSuffix}`;

    // 6. Insert Order
    const orderInsertSql = `
      INSERT INTO orders 
        (order_number, customer_id, subtotal, tax_amount, total_amount, currency, status, shipping_address, notes)
      VALUES 
        ($1, $2, $3, $4, $5, 'INR', 'PENDING', $6, $7)
      RETURNING *;
    `;
    const orderRes = await client.query(orderInsertSql, [
      orderNumber,
      userId,
      subtotal,
      taxAmount,
      totalAmount,
      shippingAddress,
      notes || null,
    ]);
    const order = orderRes.rows[0];

    // 7. Insert Order Items (Snapshots) and Deduct Stock + Log Inventory Movements
    for (const item of orderItemsToInsert) {
      // Insert item snapshot
      await client.query(
        `INSERT INTO order_items 
          (order_id, product_id, product_sku, product_name, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [order.id, item.productId, item.sku, item.name, item.unitPrice, item.quantity, item.lineTotal]
      );

      // Deduct stock
      const newStock = item.currentStock - item.quantity;
      await client.query(
        'UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2;',
        [newStock, item.productId]
      );

      // Log inventory movement
      await client.query(
        `INSERT INTO inventory_movements 
          (product_id, change_quantity, balance_after, reason, reference_id, actor_id)
         VALUES ($1, $2, $3, 'ORDER_DEDUCTION', $4, $5);`,
        [item.productId, -item.quantity, newStock, order.order_number, userId]
      );
    }

    // 8. Auto-generate Invoice
    const invoiceNumber = `INV-${today}-${randomSuffix}`;
    const invoiceRes = await client.query(
      `INSERT INTO invoices 
        (invoice_number, order_id, customer_id, subtotal, tax_amount, total_amount, currency, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'INR', 'PENDING')
       RETURNING *;`,
      [invoiceNumber, order.id, userId, subtotal, taxAmount, totalAmount]
    );
    const invoice = invoiceRes.rows[0];

    // 9. Clear the customer's cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1;', [cartId]);

    // 10. Audit log for order placement
    await logEvent({
      actorId: userId,
      action: 'ORDER_PLACED',
      entityType: 'ORDER',
      entityId: order.id,
      metadata: {
        orderNumber: order.order_number,
        itemCount: orderItemsToInsert.length,
        totalAmount,
        invoiceNumber: invoice.invoice_number,
      },
      ipAddress,
      client,
    });

    await client.query('COMMIT');

    return {
      order: {
        ...order,
        items: orderItemsToInsert,
      },
      invoice,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const listOrders = async ({ role, userId, status, page = 1, limit = 15 }) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  // Role separation: Customers can view only their own orders
  if (role !== 'admin') {
    params.push(userId);
    whereClauses.push(`o.customer_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    whereClauses.push(`o.status = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM orders o ${whereSql};`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit);
  const limitParam = `$${params.length}`;
  params.push(offset);
  const offsetParam = `$${params.length}`;

  const sql = `
    SELECT 
      o.id,
      o.order_number,
      o.customer_id,
      u.name as customer_name,
      u.email as customer_email,
      u.company_name as customer_company,
      o.subtotal,
      o.tax_amount,
      o.total_amount,
      o.currency,
      o.status,
      o.shipping_address,
      o.created_at,
      o.updated_at,
      COUNT(oi.id) as item_count,
      inv.id as invoice_id,
      inv.invoice_number
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN invoices inv ON o.id = inv.order_id
    ${whereSql}
    GROUP BY o.id, u.id, inv.id
    ORDER BY o.created_at DESC
    LIMIT ${limitParam} OFFSET ${offsetParam};
  `;

  const ordersRes = await query(sql, params);

  return {
    orders: ordersRes.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getOrderById = async (orderId, role, userId) => {
  const sql = `
    SELECT 
      o.id,
      o.order_number,
      o.customer_id,
      u.name as customer_name,
      u.email as customer_email,
      u.company_name as customer_company,
      u.phone as customer_phone,
      o.subtotal,
      o.tax_amount,
      o.total_amount,
      o.currency,
      o.status,
      o.shipping_address,
      o.notes,
      o.created_at,
      o.updated_at,
      inv.id as invoice_id,
      inv.invoice_number,
      inv.payment_status
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    LEFT JOIN invoices inv ON o.id = inv.order_id
    WHERE o.id = $1;
  `;

  const res = await query(sql, [orderId]);
  if (res.rows.length === 0) {
    throw new NotFoundError('Order not found');
  }

  const order = res.rows[0];

  // Customer authorization check
  if (role !== 'admin' && order.customer_id !== userId) {
    throw new ForbiddenError('You do not have permission to view this order');
  }

  // Fetch line items
  const itemsRes = await query(
    `SELECT id, product_id, product_sku, product_name, unit_price, quantity, line_total, created_at
     FROM order_items 
     WHERE order_id = $1 
     ORDER BY id ASC;`,
    [orderId]
  );

  return {
    ...order,
    items: itemsRes.rows,
  };
};

export const updateOrderStatus = async (orderId, newStatus, actorId, ipAddress) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Lock order for update
    const orderRes = await client.query(
      'SELECT id, order_number, customer_id, status FROM orders WHERE id = $1 FOR UPDATE;',
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      throw new NotFoundError('Order not found');
    }

    const order = orderRes.rows[0];
    const currentStatus = order.status;

    if (currentStatus === newStatus) {
      await client.query('ROLLBACK');
      return order;
    }

    // Validate permitted status transition
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Permitted transitions: ${allowedTransitions.join(', ') || 'None (terminal state)'}`
      );
    }

    // Cancellation stock restoration rule
    if (newStatus === 'CANCELLED') {
      const itemsRes = await client.query(
        'SELECT product_id, quantity, product_sku, product_name FROM order_items WHERE order_id = $1;',
        [orderId]
      );

      for (const item of itemsRes.rows) {
        if (item.product_id) {
          // Lock product row
          const prodRes = await client.query(
            'SELECT stock_quantity FROM products WHERE id = $1 FOR UPDATE;',
            [item.product_id]
          );

          if (prodRes.rows.length > 0) {
            const currentStock = prodRes.rows[0].stock_quantity;
            const restoredStock = currentStock + item.quantity;

            await client.query(
              'UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2;',
              [restoredStock, item.product_id]
            );

            // Record inventory movement for stock restoration
            await client.query(
              `INSERT INTO inventory_movements 
                (product_id, change_quantity, balance_after, reason, reference_id, actor_id)
               VALUES ($1, $2, $3, 'ORDER_CANCEL_RESTORE', $4, $5);`,
              [item.product_id, item.quantity, restoredStock, order.order_number, actorId]
            );
          }
        }
      }

      // Update invoice payment status to CANCELLED if invoice exists
      await client.query(
        `UPDATE invoices SET payment_status = 'CANCELLED' WHERE order_id = $1;`,
        [orderId]
      );
    }

    // Update order status
    const updateRes = await client.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;',
      [newStatus, orderId]
    );

    await logEvent({
      actorId,
      action: 'ORDER_STATUS_UPDATED',
      entityType: 'ORDER',
      entityId: orderId,
      metadata: {
        orderNumber: order.order_number,
        previousStatus: currentStatus,
        newStatus,
      },
      ipAddress,
      client,
    });

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export default {
  createOrderFromCart,
  listOrders,
  getOrderById,
  updateOrderStatus,
};
