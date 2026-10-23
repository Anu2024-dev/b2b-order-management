import { z } from 'zod';

export const inventoryAdjustmentSchema = z.object({
  productId: z.number().int().positive('Valid Product ID is required'),
  changeQuantity: z.number().int().refine((val) => val !== 0, {
    message: 'changeQuantity cannot be zero. Use positive for restock, negative for deduction',
  }),
  reason: z.string().min(3, 'A clear reason for adjustment must be specified').max(100),
  referenceId: z.string().max(100).optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive boolean flag is required' }),
});
