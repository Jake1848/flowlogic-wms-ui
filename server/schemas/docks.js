import { z } from 'zod';

// Dock appointment schema
export const createAppointmentSchema = z.object({
  dockId: z.string().uuid('Invalid dock ID'),
  type: z.enum(['inbound', 'outbound']),
  carrierId: z.string().uuid().optional(),
  carrierName: z.string().max(100).optional(),
  truckNumber: z.string().max(50).optional(),
  driverName: z.string().max(100).optional(),
  driverPhone: z.string().max(20).optional(),
  scheduledArrival: z.coerce.date(),
  scheduledDeparture: z.coerce.date().optional(),
  purchaseOrderIds: z.array(z.string().uuid()).optional(),
  orderIds: z.array(z.string().uuid()).optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => {
    if (data.scheduledArrival && data.scheduledDeparture) {
      return data.scheduledArrival <= data.scheduledDeparture;
    }
    return true;
  },
  { message: 'Scheduled arrival must be before departure' }
);

// Update appointment schema
export const updateAppointmentSchema = z.object({
  status: z.enum(['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  dockId: z.string().uuid().optional(),
  scheduledArrival: z.coerce.date().optional(),
  scheduledDeparture: z.coerce.date().optional(),
  actualArrival: z.coerce.date().optional(),
  actualDeparture: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
});

// Check-in schema
export const checkInSchema = z.object({
  truckNumber: z.string().max(50).optional(),
  driverName: z.string().max(100).optional(),
  driverPhone: z.string().max(20).optional(),
  sealNumber: z.string().max(50).optional(),
  trailerCondition: z.enum(['good', 'damaged', 'requires_inspection']).optional(),
  notes: z.string().max(1000).optional(),
});

// Appointment query schema
export const appointmentQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  dockId: z.string().uuid().optional(),
  type: z.enum(['inbound', 'outbound', 'all']).default('all'),
  status: z.enum(['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'all']).default('all'),
  date: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Dock management schema
export const createDockSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  name: z.string().min(1).max(50),
  type: z.enum(['inbound', 'outbound', 'both']),
  status: z.enum(['available', 'occupied', 'maintenance', 'closed']).default('available'),
  capacity: z.object({
    maxTrailerLength: z.number().positive().optional(),
    hasLiftGate: z.boolean().default(false),
    temperatureControlled: z.boolean().default(false),
  }).optional(),
  notes: z.string().max(500).optional(),
});
