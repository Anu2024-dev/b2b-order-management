import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getClient } from '../config/db.js';
import { config } from '../config/env.js';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors.js';
import { logEvent } from './audit.service.js';

export const registerUser = async ({ name, email, password, companyName, phone, address, ipAddress }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check duplicate email
  const existing = await query('SELECT id FROM users WHERE email = $1;', [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw new ConflictError('An account with this business email address already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Always register public accounts as 'customer'
    const insertRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, company_name, phone, address, is_active)
       VALUES ($1, $2, $3, 'customer', $4, $5, $6, true)
       RETURNING id, name, email, role, company_name, phone, address, created_at;`,
      [name, normalizedEmail, passwordHash, companyName || null, phone || null, address || null]
    );

    const user = insertRes.rows[0];

    // Create a database cart for the new customer
    await client.query('INSERT INTO carts (user_id) VALUES ($1);', [user.id]);

    await logEvent({
      actorId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      metadata: { email: user.email, companyName: user.company_name },
      ipAddress,
      client,
    });

    await client.query('COMMIT');

    const jti = crypto.randomUUID();
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, jti },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return { user, token };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const loginUser = async ({ email, password, ipAddress }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const userRes = await query(
    `SELECT id, name, email, password_hash, role, company_name, phone, address, is_active
     FROM users WHERE email = $1;`,
    [normalizedEmail]
  );

  // Use generic error message to prevent user enumeration
  if (userRes.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password credentials');
  }

  const user = userRes.rows[0];

  if (!user.is_active) {
    throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new UnauthorizedError('Invalid email or password credentials');
  }

  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, jti },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  await logEvent({
    actorId: user.id,
    action: 'USER_LOGIN',
    entityType: 'USER',
    entityId: user.id,
    metadata: { role: user.role },
    ipAddress,
  });

  // Ensure customer has cart
  if (user.role === 'customer') {
    await query('INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING;', [user.id]);
  }

  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
};

export const logoutUser = async ({ tokenJti, userId, ipAddress }) => {
  if (tokenJti) {
    // Add token JTI to revocation blacklist with an expiry of 24h
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await query(
      `INSERT INTO token_revocations (token_jti, user_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (token_jti) DO NOTHING;`,
      [tokenJti, userId, expiresAt]
    );
  }

  await logEvent({
    actorId: userId,
    action: 'USER_LOGOUT',
    entityType: 'USER',
    entityId: userId,
    metadata: { tokenRevoked: Boolean(tokenJti) },
    ipAddress,
  });

  return { message: 'Logged out successfully' };
};

export const getUserProfile = async (userId) => {
  const res = await query(
    `SELECT id, name, email, role, company_name, phone, address, is_active, created_at, updated_at
     FROM users WHERE id = $1;`,
    [userId]
  );
  if (res.rows.length === 0) {
    throw new BadRequestError('User not found');
  }
  return res.rows[0];
};

export const updateUserProfile = async (userId, data, ipAddress) => {
  const fields = [];
  const params = [];

  if (data.name !== undefined) {
    params.push(data.name);
    fields.push(`name = $${params.length}`);
  }
  if (data.companyName !== undefined) {
    params.push(data.companyName);
    fields.push(`company_name = $${params.length}`);
  }
  if (data.phone !== undefined) {
    params.push(data.phone);
    fields.push(`phone = $${params.length}`);
  }
  if (data.address !== undefined) {
    params.push(data.address);
    fields.push(`address = $${params.length}`);
  }

  if (fields.length === 0) {
    return getUserProfile(userId);
  }

  params.push(new Date());
  fields.push(`updated_at = $${params.length}`);

  params.push(userId);
  const sql = `
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = $${params.length}
    RETURNING id, name, email, role, company_name, phone, address, is_active, updated_at;
  `;

  const res = await query(sql, params);

  await logEvent({
    actorId: userId,
    action: 'USER_PROFILE_UPDATED',
    entityType: 'USER',
    entityId: userId,
    metadata: data,
    ipAddress,
  });

  return res.rows[0];
};

export default {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
};
