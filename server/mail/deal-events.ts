import { sendMail } from './transport';

const wrap = (title: string, body: string) => `
  <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #1a1a1a;">
    <h2 style="font-weight: 500; margin: 0 0 16px;">${title}</h2>
    ${body}
    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
    <p style="font-size: 12px; color: #999;">Notificação enviada pela Rede de Confiança Transacional B2B.</p>
  </div>
`;

const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

export async function sendDealCreatedEmail(params: {
  to: string;
  dealId: string;
  title: string;
  buyerName: string;
}) {
  const url = `${baseUrl}/deals/${params.dealId}`;
  const body = `
    <p style="line-height: 1.55;"><strong>${params.buyerName}</strong> abriu um novo deal: <strong>${params.title}</strong>.</p>
    <p style="margin: 24px 0;">
      <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px;">Abrir deal room</a>
    </p>
  `;
  await sendMail({
    to: params.to,
    subject: `Novo deal: ${params.title}`,
    html: wrap('Novo deal aberto', body),
    text: `Novo deal: ${params.title}\n${url}`,
  });
}

export async function sendDealQuotedEmail(params: {
  to: string;
  dealId: string;
  title: string;
  quoteFormatted: string;
}) {
  const url = `${baseUrl}/deals/${params.dealId}`;
  const body = `
    <p style="line-height: 1.55;">A cotação para <strong>${params.title}</strong> está disponível: <strong>${params.quoteFormatted}</strong>.</p>
    <p style="margin: 24px 0;">
      <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px;">Revisar e responder</a>
    </p>
  `;
  await sendMail({
    to: params.to,
    subject: `Cotação enviada: ${params.title}`,
    html: wrap('Cotação enviada', body),
    text: `Cotação enviada para ${params.title} (${params.quoteFormatted}): ${url}`,
  });
}

export async function sendDealAcceptedEmail(params: {
  to: string;
  dealId: string;
  title: string;
}) {
  const url = `${baseUrl}/deals/${params.dealId}`;
  const body = `
    <p style="line-height: 1.55;">A cotação para <strong>${params.title}</strong> foi aceita. Pode iniciar a execução.</p>
    <p style="margin: 24px 0;">
      <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px;">Abrir deal room</a>
    </p>
  `;
  await sendMail({
    to: params.to,
    subject: `Cotação aceita: ${params.title}`,
    html: wrap('Cotação aceita', body),
    text: `Cotação aceita para ${params.title}: ${url}`,
  });
}

export async function sendDealDeliveredEmail(params: {
  to: string;
  dealId: string;
  title: string;
}) {
  const url = `${baseUrl}/deals/${params.dealId}`;
  const body = `
    <p style="line-height: 1.55;">A entrega de <strong>${params.title}</strong> foi declarada concluída pelo fornecedor. Confirme o recebimento ou abra divergência.</p>
    <p style="margin: 24px 0;">
      <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px;">Confirmar recebimento</a>
    </p>
  `;
  await sendMail({
    to: params.to,
    subject: `Entrega declarada: ${params.title}`,
    html: wrap('Entrega declarada', body),
    text: `Entrega declarada para ${params.title}: ${url}`,
  });
}

export async function sendDealConfirmedEmail(params: {
  to: string;
  dealId: string;
  title: string;
}) {
  const url = `${baseUrl}/deals/${params.dealId}`;
  const body = `
    <p style="line-height: 1.55;">A entrega de <strong>${params.title}</strong> foi confirmada pela contraparte. O negócio entra na sua reputação.</p>
    <p style="margin: 24px 0;">
      <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px;">Ver deal room</a>
    </p>
  `;
  await sendMail({
    to: params.to,
    subject: `Entrega confirmada: ${params.title}`,
    html: wrap('Entrega confirmada', body),
    text: `Entrega confirmada para ${params.title}: ${url}`,
  });
}
