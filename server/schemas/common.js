import { z } from 'zod';

// Common ID parameter schema
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// Pagination query schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: 'Start date must be before end date' }
);

// Search query schema
export const searchSchema = z.object({
  q: z.string().min(1).max(100).optional(),
  ...paginationSchema.shape,
});
