import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export const globalLimiter =
  process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: 'Too many requests from this IP, please try again later.',
        },
      });

export const authLimiter =
  process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 50,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: 'Too many authentication attempts. Please try again after 15 minutes.',
        },
      });
