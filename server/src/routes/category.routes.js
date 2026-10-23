import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator.js';

const router = Router();

// Publicly viewable catalog categories
router.get('/', categoryController.list);

// Admin-only management
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createCategorySchema),
  categoryController.create
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateCategorySchema),
  categoryController.update
);

export default router;
