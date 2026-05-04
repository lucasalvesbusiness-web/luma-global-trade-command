import {
  SMTP_FROM,
  SMTP_INTERNAL_INBOX,
  shouldSkipSmtp,
  smtpTransport,
} from './transport';

export async function notifyBuyerSignup(input: {
  buyerName: string;
  buyerEmail: string;
  companyLegalName: string;
  countryIso2: string;
  baseUrl: string;
  companyId: string;
}): Promise<void> {
  if (shouldSkipSmtp()) return;

  await smtpTransport().sendMail({
    from: SMTP_FROM,
    to: SMTP_INTERNAL_INBOX,
    subject: `[Luma] Novo cadastro pendente — ${input.companyLegalName}`,
    text: [
      `Nova solicitação de acesso aguardando aprovação:`,
      ``,
      `Empresa: ${input.companyLegalName}`,
      `País: ${input.countryIso2}`,
      `Contato: ${input.buyerName} <${input.buyerEmail}>`,
      ``,
      `Aprovar/rejeitar: ${input.baseUrl}/admin/buyers/${input.companyId}`,
    ].join('\n'),
  });
}

export async function notifyBuyerStatusChange(input: {
  to: string;
  buyerName: string;
  companyLegalName: string;
  status: 'APPROVED' | 'REJECTED' | 'BLOCKED';
  rejectionReason?: string | null;
  baseUrl: string;
}): Promise<void> {
  if (shouldSkipSmtp()) return;

  const subject =
    input.status === 'APPROVED'
      ? 'Acesso aprovado — Luma Global Trade Command'
      : input.status === 'REJECTED'
        ? 'Cadastro não aprovado — Luma Global Trade Command'
        : 'Acesso suspenso — Luma Global Trade Command';

  const body =
    input.status === 'APPROVED'
      ? [
          `Olá ${input.buyerName},`,
          ``,
          `Seu cadastro de ${input.companyLegalName} foi aprovado.`,
          ``,
          `Acesse: ${input.baseUrl}/auth/sign-in`,
          ``,
          `No primeiro acesso você completará algumas informações.`,
        ]
      : input.status === 'REJECTED'
        ? [
            `Olá ${input.buyerName},`,
            ``,
            `Sua solicitação de acesso para ${input.companyLegalName} não foi aprovada.`,
            input.rejectionReason ? `\nMotivo: ${input.rejectionReason}` : '',
            ``,
            `Para esclarecimentos, responda este e-mail.`,
          ]
        : [
            `Olá ${input.buyerName},`,
            ``,
            `O acesso de ${input.companyLegalName} foi temporariamente suspenso.`,
            ``,
            `Entre em contato para mais informações.`,
          ];

  await smtpTransport().sendMail({
    from: SMTP_FROM,
    to: input.to,
    subject,
    text: body.filter(Boolean).join('\n'),
  });
}
