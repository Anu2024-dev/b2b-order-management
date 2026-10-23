import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be an integer greater than 0'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be an integer greater than 0'),
});
