import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { testPool, clearTestData, JWT_SECRET, createTestUser } from './test-helper.js';

describe('Authentication & Authorization Suite', () => {
  before(async () => {
    await clearTestData();
  });

  after(async () => {
    await clearTestData();
  });

  it('1. Successfully registers a new customer with hashed password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Aarav Sharma',
        email: 'aarav@techlogistics.example.com',
        password: 'Password@2026',
        companyName: 'Tech Logistics Pvt Ltd',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, 'aarav@techlogistics.example.com');
    assert.equal(res.body.data.user.role, 'customer');
    assert.equal(res.body.data.user.password_hash, undefined, 'Password hash must never be returned');
    assert.ok(res.body.data.token, 'Must return JWT token');

    // Verify hash in DB
    const dbRes = await testPool.query('SELECT password_hash FROM users WHERE email = $1;', [
      'aarav@techlogistics.example.com',
    ]);
    assert.ok(dbRes.rows[0].password_hash.startsWith('$2'));
  });

  it('2. Rejects duplicate email registration with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate User',
        email: 'aarav@techlogistics.example.com',
        password: 'Password@2026',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  it('3. Rejects invalid registration data with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'A', // too short
        email: 'invalid-email-format',
        password: '123', // too short
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
  });

  it('4. Successfully logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'aarav@techlogistics.example.com',
        password: 'Password@2026',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.role, 'customer');
  });

  it('5. Rejects invalid login password with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'aarav@techlogistics.example.com',
        password: 'WrongPassword999',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('6. Rejects non-existent email login with generic 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'SomePassword',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('7. Rejects requests without Authorization token with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    assert.equal(res.status, 401);
  });

  it('8. Rejects requests with malformed/tampered JWT token with 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.value');
    assert.equal(res.status, 401);
  });

  it('9. Rejects expired JWT token with 401', async () => {
    const expiredToken = jwt.sign(
      { userId: 1, email: 'test@example.com', role: 'customer' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    assert.equal(res.status, 401);
    assert.ok(res.body.message.includes('expired'));
  });

  it('10. Prevents customer from accessing administrator endpoints with 403 Forbidden', async () => {
    // Login as customer
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'aarav@techlogistics.example.com',
        password: 'Password@2026',
      });
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('11. Customer logout revokes token and subsequent authenticated calls return 401', async () => {
    // 1. Log in to get a fresh token with jti
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'aarav@techlogistics.example.com',
        password: 'Password@2026',
      });

    assert.equal(loginRes.status, 200);
    const token = loginRes.body.data.token;
    assert.ok(token);

    // 2. Call logout endpoint
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.body.success, true);
    assert.match(logoutRes.body.message, /logged out successfully/i);

    // 3. Attempt to access protected endpoint with the revoked token
    const afterLogoutRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(afterLogoutRes.status, 401);
    assert.equal(afterLogoutRes.body.success, false);
    assert.match(afterLogoutRes.body.message, /revoked/i);
  });

  it('12. Administrator logout revokes token and prevents access to admin endpoints', async () => {
    // 1. Create an admin user via createTestUser
    const { token: adminToken } = await createTestUser({
      name: 'System Admin',
      email: 'sysadmin@arrowstack.example.com',
      role: 'admin',
    });

    // 2. Verify admin can initially access /api/v1/admin/dashboard
    const beforeRes = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(beforeRes.status, 200);
    assert.equal(beforeRes.body.success, true);

    // 3. Admin logs out
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.body.success, true);

    // 4. Accessing admin dashboard with revoked admin token must return 401
    const afterRes = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(afterRes.status, 401);
    assert.equal(afterRes.body.success, false);
    assert.match(afterRes.body.message, /revoked/i);
  });
});
