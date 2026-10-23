import { z } from 'zod';

export const createOrderSchema = z.object({
  shippingAddress: z.string().min(5, 'A complete shipping address is required').max(500),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ], {
    errorMap: () => ({ message: 'Invalid status. Permitted: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED' }),
  }),
});
