import { Router } from 'express';
import jwt from 'jsonwebtoken';
import * as productController from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { config } from '../config/env.js';
import {
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
  productQuerySchema,
} from '../validators/product.validator.js';

const router = Router();

// Optional authentication middleware for product listing
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = { id: decoded.userId, role: decoded.role, email: decoded.email };
    } catch {
      // Ignore invalid token on public routes
    }
  }
  next();
};

router.get('/', optionalAuth, validate(productQuerySchema, 'query'), productController.list);
router.get('/:id', optionalAuth, productController.getById);

// Admin-only product mutation routes
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createProductSchema),
  productController.create
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateProductSchema),
  productController.update
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  validate(updateProductStatusSchema),
  productController.updateStatus
);

export default router;
