import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  brand: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  categoryId: z.string().optional(),
  description: z.string().trim().optional(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  mrp: z.number().min(0, 'MRP cannot be negative').nullish(),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative').nullish(),
  weight: z.string().trim().optional(),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
  purchaseDate: z.string().optional(),
  batchNumber: z.string().trim().optional(),
  storageLocation: z.string().trim().optional(),
  minimumStockLevel: z.number().min(0, 'Threshold cannot be negative'),
  notes: z.string().trim().optional(),
  tags: z.array(z.string()).optional(),
})

export type ProductFormData = z.infer<typeof productSchema>

export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  lowStockThreshold: z.number().min(0),
  expiryWarningDays: z.number().min(1),
  notificationPreferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
    expiryAlerts: z.boolean(),
    lowStockAlerts: z.boolean(),
  }),
})

export type SettingsFormData = z.infer<typeof settingsSchema>
