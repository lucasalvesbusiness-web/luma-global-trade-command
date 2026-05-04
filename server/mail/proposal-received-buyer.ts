/**
 * Confirmação enviada ao comprador no momento em que ele submete uma proposta.
 * Espelho do `proposal-notification.ts` (interno) mas no canal do buyer.
 */

import { SMTP_FROM, shouldSkipSmtp, smtpTransport } from './transport';

type Input = {
  to: string;
  buyerContactName: string;
  reference: string;
  itemsCount: number;
  destinationCountryIso2: string;
  containerCode: string;
  baseUrl: string;
};

export async function sendProposalReceivedBuyer(input: Input): Promise<void> {
  if (shouldSkipSmtp()) return;

  const link = `${input.baseUrl}/buyer/proposals/${input.reference}`;

  const lines = [
    `Olá ${input.buyerContactName},`,
    '',
    `Recebemos sua proposta ${input.reference}. Nosso time vai analisar e você receberá atualizações por e-mail a cada etapa.`,
    '',
    `Resumo:`,
    `• Destino: ${input.destinationCountryIso2}`,
    `• Container: ${input.containerCode}`,
    `• Itens: ${input.itemsCount}`,
    '',
    `Acompanhar: ${link}`,
    '',
    'Equipe Luma',
  ];

  await smtpTransport().sendMail({
    from: SMTP_FROM,
    to: input.to,
    subject: `[Luma] Proposta recebida — ${input.reference}`,
    text: lines.join('\n'),
  });
}
