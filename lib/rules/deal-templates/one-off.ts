import { z } from 'zod';

export const oneOffScopeSchema = z.object({
  summary: z.string().min(8).max(500),
  expectedDurationDays: z.number().int().positive().max(365).optional(),
  preferredStartDate: z.string().optional(), // ISO date
  locationNotes: z.string().max(500).optional(),
});

export type OneOffScope = z.infer<typeof oneOffScopeSchema>;
