import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters').max(60),
  name: z.string().min(2, 'Product name must be at least 2 characters').max(255),
  description: z.string().optional(),
  categoryId: z.number().int().positive('Category ID is required'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  stockQuantity: z.number().int().nonnegative('Initial stock must be non-negative integer'),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const updateProductStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive boolean flag is required' }),
});

export const productQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('12'),
  search: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['name', 'unit_price', 'created_at', 'stock_quantity']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
});
