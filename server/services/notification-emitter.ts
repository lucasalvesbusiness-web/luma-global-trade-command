import { db } from '@/lib/db';
import { log } from '@/lib/log/logger';

export type NotificationType =
  | 'MESSAGE_RECEIVED'
  | 'DEAL_TRANSITION'
  | 'INVITATION_ACCEPTED'
  | 'VERIFICATION_REVIEWED'
  | 'REVIEW_PENDING';

/**
 * Best-effort emit. Failure logged; never blocks caller.
 */
export async function emitNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
      },
    });
  } catch (e) {
    log.warn({ err: e, type: params.type }, 'notification_emit_failed');
  }
}

export async function emitNotificationToCompanyOwners(params: {
  companyId: string;
  excludeUserId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    const owners = await db.companyMember.findMany({
      where: { companyId: params.companyId, role: 'OWNER' },
      select: { userId: true },
    });
    await Promise.all(
      owners
        .filter((o) => o.userId !== params.excludeUserId)
        .map((o) =>
          emitNotification({
            userId: o.userId,
            type: params.type,
            title: params.title,
            body: params.body,
            link: params.link,
          }),
        ),
    );
  } catch (e) {
    log.warn({ err: e, companyId: params.companyId }, 'notification_company_emit_failed');
  }
}
