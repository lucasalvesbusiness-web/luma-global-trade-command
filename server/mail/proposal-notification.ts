/**
 * E-mail de notificação interna para o time comercial da Luma
 * quando uma nova proposta chega. Em dev usa o Mailpit SMTP
 * (localhost:1025); em prod usa o SMTP corporativo configurado
 * via env vars.
 */

import {
  SMTP_FROM,
  SMTP_INTERNAL_INBOX,
  shouldSkipSmtp,
  smtpTransport,
} from './transport';

type Payload = {
  reference: string;
  buyerLegalName: string;
  buyerContactName: string;
  destinationCountryIso2: string;
  itemsCount: number;
  containerCode: string;
};

export async function sendProposalNotification(payload: Payload): Promise<void> {
  if (shouldSkipSmtp()) {
    console.info('[proposal-notification] SMTP não configurado — pulando envio', {
      reference: payload.reference,
    });
    return;
  }

  const subject = `[Luma GTC] Nova proposta — ${payload.reference}`;

  const text = [
    `Nova proposta recebida no Luma Global Trade Command.`,
    ``,
    `Referência: ${payload.reference}`,
    `Comprador: ${payload.buyerLegalName}`,
    `Contato: ${payload.buyerContactName}`,
    `Destino: ${payload.destinationCountryIso2}`,
    `Container: ${payload.containerCode}`,
    `Itens: ${payload.itemsCount}`,
    ``,
    `Acesse o Internal Control View para triagem.`,
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, system-ui, Segoe UI, Helvetica, Arial, sans-serif; background: #F7F4EE; color: #2A2E27; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); padding: 32px;">
    <p style="text-transform: uppercase; letter-spacing: 0.32em; color: #556B2F; font-size: 11px; margin: 0 0 4px 0;">Luma × Spectre</p>
    <h1 style="font-size: 22px; font-weight: 300; margin: 0 0 24px 0; color: #2A2E27;">Nova proposta recebida</h1>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #556B2F; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em;">Referência</td><td style="padding: 8px 0; font-family: ui-monospace, Menlo, monospace; font-size: 14px; text-align: right;">${payload.reference}</td></tr>
      <tr><td style="padding: 8px 0; color: #556B2F; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em;">Comprador</td><td style="padding: 8px 0; text-align: right;">${payload.buyerLegalName}</td></tr>
      <tr><td style="padding: 8px 0; color: #556B2F; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em;">Contato</td><td style="padding: 8px 0; text-align: right;">${payload.buyerContactName}</td></tr>
      <tr><td style="padding: 8px 0; color: #556B2F; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em;">Destino</td><td style="padding: 8px 0; text-align: right;">${payload.destinationCountryIso2}</td></tr>
      <tr><td style="padding: 8px 0; color: #556B2F; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em;">Container</td><td style="padding: 8px 0; text-align: right;">${payload.containerCode}</td></tr>
      <tr><td style="padding: 8px 0; color: #556B2F; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em;">Itens</td><td style="padding: 8px 0; text-align: right;">${payload.itemsCount}</td></tr>
    </table>
    <p style="margin-top: 24px; font-size: 13px; color: rgba(42,46,39,0.7);">Acesse o Internal Control View para triagem comercial e operacional.</p>
  </div>
</body>
</html>
  `.trim();

  await smtpTransport().sendMail({
    from: SMTP_FROM,
    to: SMTP_INTERNAL_INBOX,
    subject,
    text,
    html,
  });
}
