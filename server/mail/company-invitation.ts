import { sendMail } from './transport';

const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

export async function sendCompanyInvitationEmail(params: {
  to: string;
  inviterName: string;
  companyName: string;
  roleLabel: string;
  token: string;
}) {
  const url = `${baseUrl}/auth/invitation?token=${params.token}`;
  const subject = `${params.inviterName} convidou você para ${params.companyName}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #1a1a1a;">
      <h2 style="font-weight: 500; margin: 0 0 16px;">Você foi convidado(a)</h2>
      <p style="line-height: 1.55;">
        <strong>${params.inviterName}</strong> está convidando você para entrar em
        <strong>${params.companyName}</strong> como <strong>${params.roleLabel}</strong> na
        Lastro.
      </p>
      <p style="margin: 24px 0;">
        <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px;">Aceitar convite</a>
      </p>
      <p style="font-size: 13px; color: #666;">O convite expira em 72 horas.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="font-size: 12px; color: #999;">Se você não esperava este convite, ignore este email.</p>
    </div>
  `;
  await sendMail({
    to: params.to,
    subject,
    html,
    text: `${params.inviterName} convidou você para ${params.companyName} como ${params.roleLabel}.\n\nAceitar: ${url}\n\nExpira em 72h.`,
  });
}
