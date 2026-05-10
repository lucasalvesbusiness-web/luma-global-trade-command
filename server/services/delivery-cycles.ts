import type { PrismaClient } from '@prisma/client';

import { db } from '@/lib/db';
import { recurringScopeSchema } from '@/lib/rules/deal-templates/recurring';

const cadenceMs: Record<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY', number> = {
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  BIWEEKLY: 14 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
  QUARTERLY: 91 * 24 * 60 * 60 * 1000,
};

/**
 * On RECURRING deal acceptance, materialize the cycles. Idempotent:
 * skipped if cycles already exist for this dealRoom.
 */
export async function ensureCyclesForAcceptedRecurring(
  dealRoomId: string,
  prisma: PrismaClient = db,
) {
  const dr = await prisma.dealRoom.findUnique({
    where: { id: dealRoomId },
    select: { id: true, template: true, status: true, scopePayload: true, acceptedAt: true },
  });
  if (!dr) return;
  if (dr.template !== 'RECURRING') return;
  if (dr.status !== 'ACCEPTED' && dr.status !== 'IN_PROGRESS') return;

  const existing = await prisma.deliveryCycle.count({ where: { dealRoomId } });
  if (existing > 0) return;

  const parsed = recurringScopeSchema.safeParse(dr.scopePayload);
  if (!parsed.success) return;

  const { cyclesCount, cadence } = parsed.data;
  const start = dr.acceptedAt ?? new Date();
  const stepMs = cadenceMs[cadence];

  const data = Array.from({ length: cyclesCount }, (_, i) => ({
    dealRoomId,
    ordinal: i + 1,
    scheduledAt: new Date(start.getTime() + i * stepMs),
  }));

  await prisma.deliveryCycle.createMany({ data });
}
