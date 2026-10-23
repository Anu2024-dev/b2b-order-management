import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(150),
  email: z.string().email('Valid business email address is required').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters long').max(100),
  companyName: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  companyName: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().optional(),
});
