import { query } from '../config/db.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export const getOrCreateCart = async (userId) => {
  let res = await query('SELECT id, user_id, updated_at FROM carts WHERE user_id = $1;', [userId]);
  if (res.rows.length === 0) {
    res = await query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id, user_id, updated_at;', [userId]);
  }
  return res.rows[0];
};

export const getCartDetails = async (userId) => {
  const cart = await getOrCreateCart(userId);

  const itemsSql = `
    SELECT 
      ci.id as item_id,
      ci.quantity,
      ci.created_at,
      p.id as product_id,
      p.sku,
      p.name,
      p.description,
      p.unit_price,
      p.stock_quantity,
      p.is_active,
      c.name as category_name
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ci.cart_id = $1
    ORDER BY ci.created_at ASC;
  `;

  const itemsRes = await query(itemsSql, [cart.id]);

  let subtotal = 0;
  const items = itemsRes.rows.map((row) => {
    const unitPrice = Number(row.unit_price);
    const lineTotal = Number((unitPrice * row.quantity).toFixed(2));
    const isAvailable = row.is_active && row.stock_quantity >= row.quantity;
    
    if (isAvailable) {
      subtotal += lineTotal;
    }

    return {
      itemId: row.item_id,
      productId: row.product_id,
      sku: row.sku,
      name: row.name,
      categoryName: row.category_name,
      unitPrice,
      quantity: row.quantity,
      lineTotal,
      stockQuantity: row.stock_quantity,
      isActive: row.is_active,
      isAvailable,
      stockIssue: !row.is_active 
        ? 'Product is no longer active' 
        : (row.stock_quantity < row.quantity ? `Only ${row.stock_quantity} available` : null),
    };
  });

  const taxRate = 0.18; // Standard 18% GST calculation
  const taxAmount = Number((subtotal * taxRate).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  return {
    cartId: cart.id,
    userId: cart.user_id,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    subtotal: Number(subtotal.toFixed(2)),
    taxRate: 0.18,
    taxAmount,
    totalAmount,
    currency: 'INR',
  };
};

export const addItemToCart = async (userId, productId, quantity) => {
  const cart = await getOrCreateCart(userId);

  const prodRes = await query(
    'SELECT id, sku, name, unit_price, stock_quantity, is_active FROM products WHERE id = $1;',
    [productId]
  );

  if (prodRes.rows.length === 0) {
    throw new NotFoundError('Product not found');
  }

  const product = prodRes.rows[0];
  if (!product.is_active) {
    throw new BadRequestError('Cannot add inactive product to cart');
  }

  // Check existing item in cart
  const itemRes = await query(
    'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2;',
    [cart.id, productId]
  );

  const currentCartQty = itemRes.rows.length > 0 ? itemRes.rows[0].quantity : 0;
  const totalDesiredQty = currentCartQty + quantity;

  if (totalDesiredQty > product.stock_quantity) {
    throw new BadRequestError(
      `Cannot add ${quantity} units. Available stock is ${product.stock_quantity} (already in cart: ${currentCartQty}).`
    );
  }

  if (itemRes.rows.length > 0) {
    await query(
      'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2;',
      [totalDesiredQty, itemRes.rows[0].id]
    );
  } else {
    await query(
      'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3);',
      [cart.id, productId, quantity]
    );
  }

  await query('UPDATE carts SET updated_at = NOW() WHERE id = $1;', [cart.id]);
  return getCartDetails(userId);
};

export const updateCartItem = async (userId, itemId, quantity) => {
  const cart = await getOrCreateCart(userId);

  const itemRes = await query(
    `SELECT ci.id, ci.product_id, p.stock_quantity, p.is_active 
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.id = $1 AND ci.cart_id = $2;`,
    [itemId, cart.id]
  );

  if (itemRes.rows.length === 0) {
    throw new NotFoundError('Cart item not found');
  }

  const item = itemRes.rows[0];
  if (!item.is_active) {
    throw new BadRequestError('Product is currently inactive');
  }

  if (quantity > item.stock_quantity) {
    throw new BadRequestError(`Cannot update quantity to ${quantity}. Available stock is ${item.stock_quantity}.`);
  }

  await query('UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2;', [quantity, itemId]);
  await query('UPDATE carts SET updated_at = NOW() WHERE id = $1;', [cart.id]);

  return getCartDetails(userId);
};

export const removeCartItem = async (userId, itemId) => {
  const cart = await getOrCreateCart(userId);

  const delRes = await query(
    'DELETE FROM cart_items WHERE id = $1 AND cart_id = $2 RETURNING id;',
    [itemId, cart.id]
  );

  if (delRes.rows.length === 0) {
    throw new NotFoundError('Cart item not found');
  }

  await query('UPDATE carts SET updated_at = NOW() WHERE id = $1;', [cart.id]);
  return getCartDetails(userId);
};

export const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  await query('DELETE FROM cart_items WHERE cart_id = $1;', [cart.id]);
  await query('UPDATE carts SET updated_at = NOW() WHERE id = $1;', [cart.id]);
  return { message: 'Cart cleared successfully' };
};

export default {
  getOrCreateCart,
  getCartDetails,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
