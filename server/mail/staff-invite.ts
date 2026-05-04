/**
 * Convite por e-mail para novo membro do time Luma.
 * O User+StaffMember já foi criado; este e-mail só direciona o convidado
 * para o sign-in (magic link via Auth.js).
 */

import { SMTP_FROM, shouldSkipSmtp, smtpTransport } from './transport';

type Payload = {
  to: string;
  inviteeName: string;
  role: 'STAFF' | 'ADMIN';
  team: 'COMMERCIAL' | 'OPERATIONS' | 'COMPLIANCE' | 'ADMIN';
  inviterName: string;
  baseUrl: string;
};

export async function sendStaffInvite(payload: Payload): Promise<void> {
  if (shouldSkipSmtp()) {
    console.info('[staff-invite] SMTP não configurado — pulando envio', {
      to: payload.to,
    });
    return;
  }

  const signinUrl = `${payload.baseUrl}/auth/sign-in?next=/internal`;
  const roleLabel = payload.role === 'ADMIN' ? 'Administrador' : 'Staff';
  const teamLabel = {
    COMMERCIAL: 'Comercial',
    OPERATIONS: 'Operações',
    COMPLIANCE: 'Compliance',
    ADMIN: 'Administração',
  }[payload.team];

  await smtpTransport().sendMail({
    from: SMTP_FROM,
    to: payload.to,
    subject: 'Convite — Luma Global Trade Command',
    text: [
      `Olá ${payload.inviteeName},`,
      ``,
      `${payload.inviterName} convidou você para a plataforma Luma Global Trade Command.`,
      ``,
      `Função: ${roleLabel}`,
      `Time: ${teamLabel}`,
      ``,
      `Para acessar, faça login com este e-mail (${payload.to}) em:`,
      signinUrl,
      ``,
      `Você receberá um link mágico de autenticação.`,
    ].join('\n'),
  });
}
