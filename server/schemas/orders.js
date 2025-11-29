import { z } from 'zod';

// Order line item schema
const orderLineSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

// Create order schema
export const createOrderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  orderType: z.enum(['sales', 'transfer', 'return']).default('sales'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  requestedDeliveryDate: z.coerce.date().optional(),
  shippingAddress: z.object({
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20),
    country: z.string().min(2).max(2),
  }).optional(),
  lines: z.array(orderLineSchema).min(1, 'At least one order line is required'),
  notes: z.string().max(2000).optional(),
  referenceNumber: z.string().max(50).optional(),
});

// Update order schema
export const updateOrderSchema = z.object({
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  requestedDeliveryDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
});

// Order query schema
export const orderQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'all']).default('all'),
  customerId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Wave planning schema
export const createWaveSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  orderIds: z.array(z.string().uuid()).min(1, 'At least one order is required'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledStart: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
});
