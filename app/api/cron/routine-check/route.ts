import { NextResponse, type NextRequest } from 'next/server';

import { db } from '@/lib/db';
import { computeRoutineStatus } from '@/lib/routines/status';
import {
  sendInternalDigest,
  sendOperatorReminder,
} from '@/server/mail/routine-overdue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StatusOfInterest = 'OVERDUE' | 'DUE_SOON' | 'NEVER_SUBMITTED';

const STATUSES_TO_REPORT: StatusOfInterest[] = [
  'OVERDUE',
  'DUE_SOON',
  'NEVER_SUBMITTED',
];

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const baseUrl =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const origins = await db.origin.findMany({
    where: { archivedAt: null },
    include: {
      fieldOperators: { include: { user: true } },
      fieldPlots: {
        include: {
          routine: true,
          submissions: { orderBy: { submittedAt: 'desc' }, take: 1 },
        },
      },
    },
  });

  const now = new Date();
  const internalEntries: Array<{
    originName: string;
    originSlug: string;
    plots: Array<{
      plotName: string;
      crop: string;
      status: StatusOfInterest;
      daysSinceLastSubmission: number | null;
      cadenceDays: number | null;
    }>;
  }> = [];

  let operatorEmailsSent = 0;

  for (const o of origins) {
    const flagged = o.fieldPlots
      .map((p) => {
        const last = p.submissions[0]?.submittedAt ?? null;
        const snap = computeRoutineStatus(
          p.routine
            ? { cadenceDays: p.routine.cadenceDays, active: p.routine.active }
            : null,
          last,
          now,
        );
        return { plot: p, snap, last };
      })
      .filter((r): r is typeof r & { snap: { status: StatusOfInterest } } =>
        STATUSES_TO_REPORT.includes(r.snap.status as StatusOfInterest),
      );

    if (flagged.length === 0) continue;

    const plotsForEmail = flagged.map((r) => ({
      plotName: r.plot.name,
      crop: r.plot.crop,
      status: r.snap.status,
      daysSinceLastSubmission: r.snap.daysSinceLastSubmission,
      cadenceDays: r.plot.routine?.cadenceDays ?? null,
    }));

    internalEntries.push({
      originName: o.name,
      originSlug: o.slug,
      plots: plotsForEmail,
    });

    for (const op of o.fieldOperators) {
      try {
        await sendOperatorReminder({
          to: op.user.email,
          operatorName: op.user.name ?? op.user.email,
          originName: o.name,
          originSlug: o.slug,
          baseUrl,
          plots: plotsForEmail,
        });
        operatorEmailsSent++;
      } catch (err) {
        console.error(
          '[cron/routine-check] falha ao enviar p/ operador',
          op.user.email,
          err,
        );
      }
    }
  }

  const internalInbox =
    process.env.LUMA_INTERNAL_INBOX ?? 'commercial@luma.local';

  let digestSent = false;
  if (internalEntries.length > 0) {
    try {
      await sendInternalDigest({
        to: internalInbox,
        baseUrl,
        origins: internalEntries,
      });
      digestSent = true;
    } catch (err) {
      console.error('[cron/routine-check] falha no digest interno', err);
    }
  }

  return NextResponse.json({
    ok: true,
    scannedOrigins: origins.length,
    flaggedOrigins: internalEntries.length,
    flaggedPlots: internalEntries.reduce((acc, e) => acc + e.plots.length, 0),
    operatorEmailsSent,
    digestSent,
  });
}
