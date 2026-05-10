import { db } from '@/lib/db';
import { log } from '@/lib/log/logger';
import { sendMail } from '@/server/mail/transport';

const MAIL_DISABLED = process.env.MAIL_DISABLED === '1';
const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

const wrap = (title: string, body: string) => `
  <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #1a1a1a;">
    <h2 style="font-weight: 500; margin: 0 0 16px;">${title}</h2>
    ${body}
    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
    <p style="font-size: 12px; color: #999;">Notificação enviada pela Rede de Confiança Transacional B2B.</p>
  </div>
`;

/**
 * Notify the counterparty's owners that a new message landed in a deal room.
 * Best-effort; email failures are logged but do not roll back the message
 * write.
 */
export async function notifyNewMessage(params: {
  dealRoomId: string;
  senderUserId: string;
  preview: string;
}) {
  if (MAIL_DISABLED) return;

  try {
    const dr = await db.dealRoom.findUnique({
      where: { id: params.dealRoomId },
      select: {
        id: true,
        title: true,
        buyerCompanyId: true,
        supplierCompanyId: true,
      },
    });
    if (!dr) return;

    const sender = await db.user.findUnique({
      where: { id: params.senderUserId },
      select: { name: true, companyMembers: { select: { companyId: true }, take: 1 } },
    });
    const senderCompanyId = sender?.companyMembers[0]?.companyId;
    if (!senderCompanyId) return;

    const counterpartyCompanyId =
      senderCompanyId === dr.buyerCompanyId ? dr.supplierCompanyId : dr.buyerCompanyId;

    const recipients = await db.companyMember.findMany({
      where: { companyId: counterpartyCompanyId, role: 'OWNER' },
      include: { user: { select: { email: true } } },
    });

    const url = `${baseUrl}/d/${dr.id}`;
    const senderName = sender?.name ?? 'Contraparte';
    const subject = `Nova mensagem: ${dr.title}`;
    const body = `
      <p style="line-height: 1.55;"><strong>${senderName}</strong> escreveu em <strong>${dr.title}</strong>:</p>
      <blockquote style="border-left: 3px solid #ddd; margin: 16px 0; padding: 8px 16px; color: #555;">
        ${params.preview.replace(/\n/g, '<br/>')}
      </blockquote>
      <p style="margin: 24px 0;">
        <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px;">Responder no deal room</a>
      </p>
    `;

    await Promise.all(
      recipients.map((m) =>
        m.user.email
          ? sendMail({
              to: m.user.email,
              subject,
              html: wrap('Nova mensagem', body),
              text: `${senderName}: ${params.preview}\n\n${url}`,
            })
          : null,
      ),
    );
  } catch (e) {
    log.warn({ err: e, dealRoomId: params.dealRoomId }, 'deal_message_email_failed');
  }
}
