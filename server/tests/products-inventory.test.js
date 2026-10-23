import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { testPool, clearTestData, createTestUser } from './test-helper.js';

describe('Products & Inventory Suite', () => {
  let adminToken;
  let customerToken;
  let categoryId;
  let productId;

  before(async () => {
    await clearTestData();

    const admin = await createTestUser({
      name: 'Admin Tester',
      email: 'admin.tester@arrow.example.com',
      role: 'admin',
    });
    adminToken = admin.token;

    const customer = await createTestUser({
      name: 'Customer Tester',
      email: 'customer.tester@arrow.example.com',
      role: 'customer',
    });
    customerToken = customer.token;

    // Create a category
    const catRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Automation & Sensors',
        description: 'Industrial automation components',
      });
    categoryId = catRes.body.data.id;
  });

  after(async () => {
    await clearTestData();
  });

  it('1. Admin creates a product successfully', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'SKU-SENS-001',
        name: 'Optical Sensor 24V',
        description: 'Proximity detection optical sensor',
        categoryId,
        unitPrice: 1500.5,
        stockQuantity: 25,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.sku, 'SKU-SENS-001');
    productId = res.body.data.id;

    // Verify initial inventory movement was recorded
    const movRes = await testPool.query(
      'SELECT change_quantity, balance_after, reason FROM inventory_movements WHERE product_id = $1;',
      [productId]
    );
    assert.equal(movRes.rows.length, 1);
    assert.equal(movRes.rows[0].change_quantity, 25);
    assert.equal(movRes.rows[0].reason, 'INITIAL_SETUP');
  });

  it('2. Rejects duplicate SKU with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'SKU-SENS-001',
        name: 'Another Sensor',
        categoryId,
        unitPrice: 2000,
        stockQuantity: 10,
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  it('3. Rejects negative price or negative stock with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'SKU-INVALID-001',
        name: 'Invalid Item',
        categoryId,
        unitPrice: -100,
        stockQuantity: -5,
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('4. Allows admin to adjust inventory positively and records movement', async () => {
    const res = await request(app)
      .post('/api/v1/admin/inventory/adjustments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        changeQuantity: 15,
        reason: 'RESTOCK_SHIPMENT',
        referenceId: 'PO-2026-99',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.product.previousStock, 25);
    assert.equal(res.body.data.product.currentStock, 40);
  });

  it('5. Rejects stock deduction exceeding available balance (preventing negative inventory)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/inventory/adjustments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        changeQuantity: -100, // Available is 40
        reason: 'DAMAGE_WRITE_OFF',
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.message.includes('Insufficient inventory'));

    // Check balance remained 40
    const checkRes = await testPool.query('SELECT stock_quantity FROM products WHERE id = $1;', [
      productId,
    ]);
    assert.equal(checkRes.rows[0].stock_quantity, 40);
  });

  it('6. Deactivated product is hidden from customer product catalog', async () => {
    // Admin deactivates product
    await request(app)
      .patch(`/api/v1/products/${productId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    // Customer lists products
    const res = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(res.status, 200);
    const found = res.body.data.find((p) => p.id === productId);
    assert.equal(found, undefined, 'Deactivated product must not appear in customer list');
  });
});
