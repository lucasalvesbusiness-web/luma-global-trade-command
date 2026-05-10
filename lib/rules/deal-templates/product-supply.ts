import { z } from 'zod';

export const productSupplyScopeSchema = z.object({
  summary: z.string().min(8).max(500),
  itemDescription: z.string().min(2).max(200),
  quantity: z.number().positive(),
  unit: z.string().max(20).default('un'),
  expectedDeliveryDays: z.number().int().positive().max(180).optional(),
});

export type ProductSupplyScope = z.infer<typeof productSupplyScopeSchema>;
