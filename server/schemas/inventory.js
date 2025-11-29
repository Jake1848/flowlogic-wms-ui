import { z } from 'zod';

// Inventory adjustment schema
export const inventoryAdjustmentSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  locationId: z.string().uuid('Invalid location ID'),
  quantity: z.number().int('Quantity must be an integer'),
  reason: z.string().min(1, 'Reason is required').max(500),
  adjustmentType: z.enum(['add', 'remove', 'set', 'transfer']),
  referenceNumber: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

// Inventory transfer schema
export const inventoryTransferSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  fromLocationId: z.string().uuid('Invalid source location ID'),
  toLocationId: z.string().uuid('Invalid destination location ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  reason: z.string().max(500).optional(),
  lotNumber: z.string().max(50).optional(),
  serialNumbers: z.array(z.string().max(100)).optional(),
});

// Cycle count schema
export const cycleCountSchema = z.object({
  locationId: z.string().uuid('Invalid location ID'),
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    countedQuantity: z.number().int().min(0, 'Quantity cannot be negative'),
    lotNumber: z.string().max(50).optional(),
    notes: z.string().max(500).optional(),
  })).min(1, 'At least one item must be counted'),
  countedBy: z.string().max(100).optional(),
});

// Inventory query schema
export const inventoryQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  sku: z.string().max(50).optional(),
  minQuantity: z.coerce.number().int().optional(),
  maxQuantity: z.coerce.number().int().optional(),
  status: z.enum(['available', 'reserved', 'damaged', 'expired', 'all']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Lot tracking schema
export const lotSchema = z.object({
  lotNumber: z.string().min(1).max(50),
  productId: z.string().uuid('Invalid product ID'),
  manufacturingDate: z.coerce.date().optional(),
  expirationDate: z.coerce.date().optional(),
  quantity: z.number().int().positive(),
  supplierId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => {
    if (data.manufacturingDate && data.expirationDate) {
      return data.manufacturingDate <= data.expirationDate;
    }
    return true;
  },
  { message: 'Manufacturing date must be before expiration date' }
);
