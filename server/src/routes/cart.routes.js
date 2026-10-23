import { Router } from 'express';
import * as cartController from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { addToCartSchema, updateCartItemSchema } from '../validators/cart.validator.js';

const router = Router();

// Cart operations are strictly customer-only
router.use(authenticate, authorize('customer'));

router.get('/', cartController.getCart);
router.post('/items', validate(addToCartSchema), cartController.addItem);
router.patch('/items/:itemId', validate(updateCartItemSchema), cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clear);

export default router;
