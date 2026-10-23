import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { query } from '../config/db.js';
import { UnauthorizedError } from '../utils/errors.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or invalid format');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Authentication token has expired. Please log in again.');
      }
      throw new UnauthorizedError('Invalid authentication token');
    }

    // Check token revocation table if jti is present
    if (decoded.jti) {
      const revokedCheck = await query(
        'SELECT id FROM token_revocations WHERE token_jti = $1;',
        [decoded.jti]
      );
      if (revokedCheck.rows.length > 0) {
        throw new UnauthorizedError('Session terminated: token has been revoked.');
      }
    }

    // Ensure user still exists and is active
    const userResult = await query(
      'SELECT id, name, email, role, company_name, is_active FROM users WHERE id = $1;',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('User account no longer exists');
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      throw new UnauthorizedError('Account is currently deactivated. Please contact support.');
    }

    req.user = user;
    req.tokenJti = decoded.jti;
    next();
  } catch (error) {
    next(error);
  }
};
