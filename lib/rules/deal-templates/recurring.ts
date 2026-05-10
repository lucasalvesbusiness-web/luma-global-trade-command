import { z } from 'zod';

export const recurringScopeSchema = z.object({
  summary: z.string().min(8).max(500),
  cadence: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY']),
  cyclesCount: z.number().int().positive().max(48),
  startMonth: z.string().optional(), // YYYY-MM
});

export type RecurringScope = z.infer<typeof recurringScopeSchema>;
