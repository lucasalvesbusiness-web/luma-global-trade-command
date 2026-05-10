import { db } from '@/lib/db';
import { log } from '@/lib/log/logger';

export type ActivityType = 'DEAL_CONFIRMED' | 'COMPANY_VERIFIED' | 'COMPANY_JOINED';

/**
 * Best-effort emit. Failures are logged; never block the calling service.
 */
async function emit(params: {
  type: ActivityType;
  actorCompanyId: string;
  subjectCompanyId?: string | null;
  dealRoomId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.activityEvent.create({
      data: {
        type: params.type,
        actorCompanyId: params.actorCompanyId,
        subjectCompanyId: params.subjectCompanyId ?? null,
        dealRoomId: params.dealRoomId ?? null,
        visibility: 'PUBLIC',
        metadata: (params.metadata as never) ?? null,
      },
    });
  } catch (e) {
    log.warn({ err: e, type: params.type }, 'activity_emit_failed');
  }
}

export async function emitDealConfirmed(dealRoomId: string) {
  const dr = await db.dealRoom.findUnique({
    where: { id: dealRoomId },
    select: {
      buyerCompanyId: true,
      supplierCompanyId: true,
      title: true,
      template: true,
      quoteCents: true,
      quoteCurrency: true,
    },
  });
  if (!dr) return;
  // Two events — one from each side — so the activity surfaces in both
  // companies' feeds and watchers see it.
  await Promise.all([
    emit({
      type: 'DEAL_CONFIRMED',
      actorCompanyId: dr.buyerCompanyId,
      subjectCompanyId: dr.supplierCompanyId,
      dealRoomId,
      metadata: { title: dr.title, template: dr.template, role: 'BUYER' },
    }),
    emit({
      type: 'DEAL_CONFIRMED',
      actorCompanyId: dr.supplierCompanyId,
      subjectCompanyId: dr.buyerCompanyId,
      dealRoomId,
      metadata: { title: dr.title, template: dr.template, role: 'SUPPLIER' },
    }),
  ]);
}

export async function emitCompanyVerified(companyId: string) {
  await emit({ type: 'COMPANY_VERIFIED', actorCompanyId: companyId });
}

export async function emitCompanyJoined(companyId: string) {
  await emit({ type: 'COMPANY_JOINED', actorCompanyId: companyId });
}
