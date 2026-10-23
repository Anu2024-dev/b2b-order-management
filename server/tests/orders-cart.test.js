import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { testPool, clearTestData, createTestUser } from './test-helper.js';

describe('Cart & Orders Transactional Suite', () => {
  let adminToken;
  let customerAToken;
  let customerBToken;
  let customerAId;
  let product1Id;
  let product2Id;
  let createdOrderId;

  before(async () => {
    await clearTestData();

    const admin = await createTestUser({
      name: 'Admin Supervisor',
      email: 'admin.super@arrow.example.com',
      role: 'admin',
    });
    adminToken = admin.token;

    const custA = await createTestUser({
      name: 'Customer Alpha',
      email: 'alpha@enterprise.example.com',
      role: 'customer',
      companyName: 'Alpha Corp',
    });
    customerAToken = custA.token;
    customerAId = custA.user.id;

    const custB = await createTestUser({
      name: 'Customer Beta',
      email: 'beta@enterprise.example.com',
      role: 'customer',
      companyName: 'Beta Industries',
    });
    customerBToken = custB.token;

    // Create Category & 2 Products
    const catRes = await testPool.query(
      `INSERT INTO categories (name, description, is_active) VALUES ('Hardware', 'Tools & fasteners', true) RETURNING id;`
    );
    const catId = catRes.rows[0].id;

    const p1 = await testPool.query(
      `INSERT INTO products (sku, name, category_id, unit_price, stock_quantity, is_active)
       VALUES ('SKU-BOLT-100', 'M10 Structural Bolts', $1, 20.00, 50, true)
       RETURNING id;`,
      [catId]
    );
    product1Id = p1.rows[0].id;

    const p2 = await testPool.query(
      `INSERT INTO products (sku, name, category_id, unit_price, stock_quantity, is_active)
       VALUES ('SKU-NUT-200', 'M10 Flange Nuts', $1, 10.00, 100, true)
       RETURNING id;`,
      [catId]
    );
    product2Id = p2.rows[0].id;
  });

  after(async () => {
    await clearTestData();
  });

  it('1. Customer adds items to cart and server calculates accurate totals', async () => {
    // Add 10 bolts
    const res1 = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ productId: product1Id, quantity: 10 });

    assert.equal(res1.status, 200);
    assert.equal(res1.body.data.itemCount, 10);
    assert.equal(res1.body.data.subtotal, 200.0); // 10 * 20.00

    // Add 20 nuts
    const res2 = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ productId: product2Id, quantity: 20 });

    assert.equal(res2.status, 200);
    assert.equal(res2.body.data.itemCount, 30);
    // Subtotal: (10 * 20) + (20 * 10) = 400.00
    assert.equal(res2.body.data.subtotal, 400.0);
    // 18% GST: 72.00, Total: 472.00
    assert.equal(res2.body.data.taxAmount, 72.0);
    assert.equal(res2.body.data.totalAmount, 472.0);
  });

  it('2. Customer successfully places order in transaction, inventory is deducted atomically', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        shippingAddress: '42 Industrial Park, Sector 5, Bengaluru',
        notes: 'Deliver to Warehouse Gate 2',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.order.order_number);
    assert.equal(res.body.data.order.status, 'PENDING');
    assert.equal(res.body.data.order.subtotal, '400.00');
    assert.equal(res.body.data.order.total_amount, '472.00');
    createdOrderId = res.body.data.order.id;

    // Verify invoice was automatically created
    assert.ok(res.body.data.invoice.invoice_number);

    // Verify inventory was deducted
    const stockP1 = await testPool.query('SELECT stock_quantity FROM products WHERE id = $1;', [
      product1Id,
    ]);
    const stockP2 = await testPool.query('SELECT stock_quantity FROM products WHERE id = $1;', [
      product2Id,
    ]);
    assert.equal(stockP1.rows[0].stock_quantity, 40); // 50 - 10
    assert.equal(stockP2.rows[0].stock_quantity, 80); // 100 - 20

    // Verify cart was cleared
    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customerAToken}`);
    assert.equal(cartRes.body.data.itemCount, 0);
  });

  it('3. Customer B is forbidden from accessing Customer A order details (IDOR protection)', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${customerBToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('4. Admin can view Customer A order details', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, createdOrderId);
    assert.equal(res.body.data.items.length, 2);
    // Verify snapshot fields
    assert.equal(res.body.data.items[0].product_sku, 'SKU-BOLT-100');
  });

  it('5. Rejects invalid order status transition (e.g. PENDING -> DELIVERED directly)', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DELIVERED' });

    assert.equal(res.status, 400);
    assert.ok(res.body.message.includes('Invalid status transition'));
  });

  it('6. Cancelling an order restores inventory back to products with audit movement', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELLED' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'CANCELLED');

    // Verify stock restored
    const stockP1 = await testPool.query('SELECT stock_quantity FROM products WHERE id = $1;', [
      product1Id,
    ]);
    const stockP2 = await testPool.query('SELECT stock_quantity FROM products WHERE id = $1;', [
      product2Id,
    ]);
    assert.equal(stockP1.rows[0].stock_quantity, 50); // restored from 40 back to 50
    assert.equal(stockP2.rows[0].stock_quantity, 100); // restored from 80 back to 100

    // Verify restoration inventory movement was logged
    const movRes = await testPool.query(
      `SELECT reason, change_quantity FROM inventory_movements 
       WHERE product_id = $1 AND reason = 'ORDER_CANCEL_RESTORE';`,
      [product1Id]
    );
    assert.equal(movRes.rows.length, 1);
    assert.equal(movRes.rows[0].change_quantity, 10);
  });
});
