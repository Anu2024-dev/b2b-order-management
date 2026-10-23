import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.validator.js';

const router = Router();

router.use(authenticate);

// Customer creates order
router.post('/', authorize('customer'), validate(createOrderSchema), orderController.createOrder);

// Customer views own orders; Admin views all orders
router.get('/', orderController.listOrders);
router.get('/:id', orderController.getOrder);

// Admin-only order status progression
router.patch(
  '/:id/status',
  authorize('admin'),
  validate(updateOrderStatusSchema),
  orderController.updateStatus
);

export default router;
