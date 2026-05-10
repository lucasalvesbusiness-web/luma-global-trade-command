import type { DealRoomStatus } from '@/lib/types/enums';

import { db } from '@/lib/db';
import { log } from '@/lib/log/logger';
import { emitNotificationToCompanyOwners } from '@/server/services/notification-emitter';
import {
  sendDealAcceptedEmail,
  sendDealConfirmedEmail,
  sendDealCreatedEmail,
  sendDealDeliveredEmail,
  sendDealQuotedEmail,
} from '@/server/mail/deal-events';

const MAIL_DISABLED = process.env.MAIL_DISABLED === '1';

async function ownerEmailsForCompany(companyId: string): Promise<string[]> {
  const owners = await db.companyMember.findMany({
    where: { companyId, role: 'OWNER' },
    include: { user: { select: { email: true } } },
  });
  return owners.map((m) => m.user.email).filter((e): e is string => !!e);
}

async function dealContext(dealRoomId: string) {
  const dr = await db.dealRoom.findUnique({
    where: { id: dealRoomId },
    select: {
      id: true,
      title: true,
      buyerCompanyId: true,
      supplierCompanyId: true,
      quoteCents: true,
      quoteCurrency: true,
      buyerCompany: { select: { tradeName: true, legalName: true } },
    },
  });
  return dr;
}

export async function notifyDealTransition(params: {
  dealRoomId: string;
  to: DealRoomStatus;
}) {
  const dr = await dealContext(params.dealRoomId);
  if (!dr) return;

  // In-app notifications always fire (independent of MAIL_DISABLED).
  const link = `/d/${dr.id}`;
  const recipientCompanyId =
    params.to === 'OPENED' ||
    params.to === 'ACCEPTED' ||
    params.to === 'CONFIRMED'
      ? dr.supplierCompanyId
      : dr.buyerCompanyId;
  const titleByStatus: Record<string, string> = {
    OPENED: `Novo deal: ${dr.title}`,
    QUOTED: `Cotação enviada: ${dr.title}`,
    ACCEPTED: `Cotação aceita: ${dr.title}`,
    DELIVERED: `Entrega declarada: ${dr.title}`,
    CONFIRMED: `Entrega confirmada: ${dr.title}`,
  };
  if (titleByStatus[params.to]) {
    await emitNotificationToCompanyOwners({
      companyId: recipientCompanyId,
      type: 'DEAL_TRANSITION',
      title: titleByStatus[params.to]!,
      link,
    });
  }

  if (MAIL_DISABLED) return;

  const buyerEmails = await ownerEmailsForCompany(dr.buyerCompanyId);
  const supplierEmails = await ownerEmailsForCompany(dr.supplierCompanyId);

  try {
    if (params.to === 'OPENED') {
      const buyerName = dr.buyerCompany.tradeName ?? dr.buyerCompany.legalName;
      await Promise.all(
        supplierEmails.map((to) =>
          sendDealCreatedEmail({ to, dealId: dr.id, title: dr.title, buyerName }),
        ),
      );
    } else if (params.to === 'QUOTED') {
      const formatted =
        dr.quoteCents !== null
          ? (dr.quoteCents! / 100).toLocaleString('pt-BR', {
              style: 'currency',
              currency: dr.quoteCurrency ?? 'BRL',
            })
          : '—';
      await Promise.all(
        buyerEmails.map((to) =>
          sendDealQuotedEmail({ to, dealId: dr.id, title: dr.title, quoteFormatted: formatted }),
        ),
      );
    } else if (params.to === 'ACCEPTED') {
      await Promise.all(
        supplierEmails.map((to) =>
          sendDealAcceptedEmail({ to, dealId: dr.id, title: dr.title }),
        ),
      );
    } else if (params.to === 'DELIVERED') {
      await Promise.all(
        buyerEmails.map((to) =>
          sendDealDeliveredEmail({ to, dealId: dr.id, title: dr.title }),
        ),
      );
    } else if (params.to === 'CONFIRMED') {
      await Promise.all(
        supplierEmails.map((to) =>
          sendDealConfirmedEmail({ to, dealId: dr.id, title: dr.title }),
        ),
      );
    }
  } catch (e) {
    log.warn({ err: e, dealRoomId: dr.id, to: params.to }, 'deal_email_failed');
  }
}
