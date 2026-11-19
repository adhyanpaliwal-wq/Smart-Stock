import { z } from 'zod';

// Constants synchronized verbatim with firebase-blueprint.json
export const SKU_REGEX = /^[a-zA-Z0-9_\-.]+$/;
export const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(160),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required').max(100),
    businessName: z.string().trim().min(2, 'Business / shop name is required').max(120),
    email: z.string().trim().email('Enter a valid email address').max(160),
    mobileNumber: z
      .string()
      .trim()
      .min(10, 'Enter a valid 10-digit mobile number')
      .max(20, 'Mobile number is too long')
      .regex(/^[0-9+\-\s()]{10,20}$/, 'Enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
    confirmPassword: z.string().min(6, 'Confirm your password').max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(160),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(120),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU / code is required')
    .max(40, 'SKU max 40 characters')
    .regex(SKU_REGEX, 'SKU can only contain letters, numbers, hyphens, underscores, and dots'),
  category: z.string().trim().min(1, 'Select a category').max(60),
  stockQuantity: z.coerce
    .number()
    .min(0, 'Stock cannot be negative')
    .max(1000000, 'Stock quantity exceeds limit'),
  minStockLevel: z.coerce
    .number()
    .min(0, 'Minimum stock level cannot be negative')
    .max(1000000, 'Minimum stock level exceeds limit'),
  purchasePrice: z.coerce
    .number()
    .min(0, 'Purchase price cannot be negative')
    .max(10000000, 'Purchase price exceeds limit'),
  sellingPrice: z.coerce
    .number()
    .min(0, 'Selling price cannot be negative')
    .max(10000000, 'Selling price exceeds limit'),
  supplierName: z.string().trim().max(100, 'Supplier name max 100 characters'),
  unit: z.string().trim().min(1, 'Unit is required').max(24),
  imageUrl: z
    .string()
    .trim()
    .max(500, 'Image URL max 500 characters')
    .optional()
    .or(z.literal('')),
});

export const settingsSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(100),
  businessName: z.string().trim().min(2, 'Business name is required').max(120),
  shopCategory: z.string().trim().min(2, 'Select shop category').max(60),
  mobileNumber: z.string().trim().min(10, 'Enter a valid mobile number').max(20),
  address: z.string().trim().max(250, 'Address max 250 characters'),
  city: z.string().trim().max(80, 'City max 80 characters').optional().or(z.literal('')),
  state: z.string().trim().max(80, 'State max 80 characters').optional().or(z.literal('')),
  gstin: z.string().trim().max(20, 'GSTIN max 20 characters').optional().or(z.literal('')),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  shopName: z.string().trim().min(2, 'Please enter your shop name').max(120),
  phoneOrEmail: z.string().trim().min(5, 'Enter your email or phone number').max(160),
  message: z.string().trim().min(10, 'Please tell us briefly about your store').max(500),
});

export function truncateStr(val: string | undefined | null, maxLen: number): string {
  return (val ?? '').trim().slice(0, maxLen);
}
