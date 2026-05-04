/**
 * Notifica o comprador quando o staff Luma transiciona o status da proposta.
 * Cobre as 5 transições visíveis ao buyer (UNDER_COMMERCIAL_REVIEW,
 * UNDER_OPERATIONAL_REVIEW, DOCUMENTATION_REVIEW_REQUIRED, ADJUSTMENT_REQUESTED,
 * APPROVED_FOR_NEGOTIATION, REJECTED, CONVERTED_TO_OPERATION).
 *
 * Falhas são tratadas no caller (best-effort — nunca bloqueiam a transição DB).
 */

import { SMTP_FROM, shouldSkipSmtp, smtpTransport } from './transport';

import type { ProposalStatus } from '@/server/repositories/types';

type Input = {
  to: string;
  buyerContactName: string;
  reference: string;
  toStatus: ProposalStatus;
  buyerNoteBody?: string | null;
  baseUrl: string;
};

const subjectByStatus: Partial<Record<ProposalStatus, string>> = {
  UNDER_COMMERCIAL_REVIEW: 'Sua proposta entrou em análise comercial',
  UNDER_OPERATIONAL_REVIEW: 'Sua proposta entrou em análise operacional',
  DOCUMENTATION_REVIEW_REQUIRED: 'Sua proposta está em revisão de documentação',
  ADJUSTMENT_REQUESTED: 'Ajuste solicitado na sua proposta',
  APPROVED_FOR_NEGOTIATION: 'Sua proposta foi aprovada para negociação',
  REJECTED: 'Sua proposta não foi aprovada',
  CONVERTED_TO_OPERATION: 'Sua proposta avançou para execução',
};

const blurbByStatus: Partial<Record<ProposalStatus, string>> = {
  UNDER_COMMERCIAL_REVIEW:
    'Nosso time comercial está revisando os detalhes. Em breve você terá novidades por aqui.',
  UNDER_OPERATIONAL_REVIEW:
    'A operação está validando viabilidade logística. Sem ação necessária da sua parte.',
  DOCUMENTATION_REVIEW_REQUIRED:
    'Estamos verificando a documentação aplicável ao destino. Sem ação necessária da sua parte.',
  ADJUSTMENT_REQUESTED:
    'O time pediu um ajuste. Acesse a proposta para ver o que foi solicitado e enviar a versão atualizada.',
  APPROVED_FOR_NEGOTIATION:
    'A proposta foi aprovada para a fase de negociação. Nosso comercial entrará em contato pra fechar os detalhes.',
  REJECTED:
    'Após análise não foi possível avançar com esta proposta. Veja o detalhe da decisão na sua área de propostas.',
  CONVERTED_TO_OPERATION:
    'A proposta avançou para execução operacional. A partir daqui, o acompanhamento segue fora da plataforma com nosso comercial.',
};

export async function sendProposalStatusChanged(input: Input): Promise<void> {
  if (shouldSkipSmtp()) return;

  const subject = subjectByStatus[input.toStatus];
  const blurb = blurbByStatus[input.toStatus];
  if (!subject || !blurb) return; // status sem comunicação ao buyer (DRAFT, SUBMITTED)

  const link = `${input.baseUrl}/buyer/proposals/${input.reference}`;
  const noteBlock = input.buyerNoteBody
    ? ['', 'Mensagem do time Luma:', input.buyerNoteBody, '']
    : [];

  const lines = [
    `Olá ${input.buyerContactName},`,
    '',
    blurb,
    ...noteBlock,
    `Proposta: ${input.reference}`,
    `Acompanhar: ${link}`,
    '',
    'Equipe Luma',
  ];

  await smtpTransport().sendMail({
    from: SMTP_FROM,
    to: input.to,
    subject: `[Luma] ${subject} — ${input.reference}`,
    text: lines.join('\n'),
  });
}
