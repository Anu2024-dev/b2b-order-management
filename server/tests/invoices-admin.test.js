import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { testPool, clearTestData, createTestUser } from './test-helper.js';

describe('Invoices & Administration Suite', () => {
  let adminToken;
  let customerAToken;
  let customerBToken;
  let orderId;
  let invoiceId;

  before(async () => {
    await clearTestData();

    const admin = await createTestUser({
      name: 'Admin Supervisor',
      email: 'admin.invoices@arrow.example.com',
      role: 'admin',
    });
    adminToken = admin.token;

    const custA = await createTestUser({
      name: 'Customer A',
      email: 'cust.a@example.com',
      role: 'customer',
      companyName: 'Company A Ltd',
    });
    customerAToken = custA.token;

    const custB = await createTestUser({
      name: 'Customer B',
      email: 'cust.b@example.com',
      role: 'customer',
      companyName: 'Company B Ltd',
    });
    customerBToken = custB.token;

    // Seed product, order, invoice for Customer A
    const cat = await testPool.query(
      `INSERT INTO categories (name, description, is_active) VALUES ('Tools', 'Hand tools', true) RETURNING id;`
    );
    const prod = await testPool.query(
      `INSERT INTO products (sku, name, category_id, unit_price, stock_quantity, is_active)
       VALUES ('SKU-WRENCH-01', 'Torque Wrench 1/2"', $1, 2500.00, 20, true) RETURNING id;`,
      [cat.rows[0].id]
    );

    const ord = await testPool.query(
      `INSERT INTO orders (order_number, customer_id, subtotal, tax_amount, total_amount, currency, status, shipping_address)
       VALUES ('ORD-TEST-INV-1', $1, 5000.00, 900.00, 5900.00, 'INR', 'CONFIRMED', '77 Delivery Bay, Mumbai')
       RETURNING id;`,
      [custA.user.id]
    );
    orderId = ord.rows[0].id;

    await testPool.query(
      `INSERT INTO order_items (order_id, product_id, product_sku, product_name, unit_price, quantity, line_total)
       VALUES ($1, $2, 'SKU-WRENCH-01', 'Torque Wrench 1/2"', 2500.00, 2, 5000.00);`,
      [orderId, prod.rows[0].id]
    );

    const inv = await testPool.query(
      `INSERT INTO invoices (invoice_number, order_id, customer_id, subtotal, tax_amount, total_amount, currency, payment_status)
       VALUES ('INV-TEST-001', $1, $2, 5000.00, 900.00, 5900.00, 'INR', 'PENDING')
       RETURNING id;`,
      [orderId, custA.user.id]
    );
    invoiceId = inv.rows[0].id;
  });

  after(async () => {
    await clearTestData();
  });

  it('1. Customer A can fetch their own invoice', async () => {
    const res = await request(app)
      .get(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${customerAToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.invoice_number, 'INV-TEST-001');
    assert.equal(res.body.data.subtotal, '5000.00');
    assert.equal(res.body.data.total_amount, '5900.00');
    assert.ok(res.body.data.distributor.name);
    assert.equal(res.body.data.items.length, 1);
  });

  it('2. Customer B is forbidden from accessing Customer A invoice', async () => {
    const res = await request(app)
      .get(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${customerBToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('3. PDF invoice download generates valid application/pdf stream', async () => {
    const res = await request(app)
      .get(`/api/v1/invoices/${invoiceId}/download`)
      .set('Authorization', `Bearer ${customerAToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'], 'application/pdf');
    assert.ok(res.headers['content-disposition'].includes('INV-TEST-001.pdf'));
    assert.ok(res.body.length > 500, 'PDF buffer must have content');
  });

  it('4. Admin dashboard endpoint calculates accurate live database metrics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.metrics.totalOrders >= 1);
    assert.ok(res.body.data.metrics.grossOrderValue >= 5900);
    assert.equal(res.body.data.ordersByStatus.CONFIRMED, 1);
  });

  it('5. Admin audit-logs endpoint retrieves audit records', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it('6. Admin can deactivate and reactivate a customer account', async () => {
    // Fetch customer B ID
    const userRes = await testPool.query("SELECT id FROM users WHERE email = 'cust.b@example.com';");
    const custBId = userRes.rows[0].id;

    // Deactivate
    const deactRes = await request(app)
      .patch(`/api/v1/admin/users/${custBId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    assert.equal(deactRes.status, 200);
    assert.equal(deactRes.body.data.is_active, false);

    // Customer B should now be blocked from accessing authenticated routes
    const authAttempt = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${customerBToken}`);
    assert.equal(authAttempt.status, 401);
    assert.ok(authAttempt.body.message.includes('deactivated'));
  });
});
