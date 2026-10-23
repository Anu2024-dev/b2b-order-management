import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const testPool = new pg.Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_TEST_NAME || 'b2b_order_db_test',
});

export const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_arrowstack_2026';

export const createTestUser = async ({
  name = 'Test User',
  email,
  password = 'TestPassword123!',
  role = 'customer',
  companyName = 'Test Company',
}) => {
  const hash = await bcrypt.hash(password, 10);
  const res = await testPool.query(
    `INSERT INTO users (name, email, password_hash, role, company_name, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id, name, email, role, company_name;`,
    [name, email.toLowerCase(), hash, role, companyName]
  );
  const user = res.rows[0];

  if (role === 'customer') {
    await testPool.query('INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING;', [user.id]);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, jti: `jti-${Date.now()}-${Math.random()}` },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  return { user, token };
};

export const clearTestData = async () => {
  const client = await testPool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM token_revocations;');
    await client.query('DELETE FROM audit_logs;');
    await client.query('DELETE FROM invoices;');
    await client.query('DELETE FROM order_items;');
    await client.query('DELETE FROM orders;');
    await client.query('DELETE FROM cart_items;');
    await client.query('DELETE FROM carts;');
    await client.query('DELETE FROM inventory_movements;');
    await client.query('DELETE FROM products;');
    await client.query('DELETE FROM categories;');
    await client.query('DELETE FROM users;');
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
