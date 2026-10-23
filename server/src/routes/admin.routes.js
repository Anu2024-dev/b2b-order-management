import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { inventoryAdjustmentSchema, updateUserStatusSchema } from '../validators/admin.validator.js';

const router = Router();

// Strictly admin only
router.use(authenticate, authorize('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/reports', adminController.getReports);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/inventory', adminController.getInventoryMovements);
router.post(
  '/inventory/adjustments',
  validate(inventoryAdjustmentSchema),
  adminController.adjustInventory
);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', validate(updateUserStatusSchema), adminController.updateUserStatus);

export default router;
