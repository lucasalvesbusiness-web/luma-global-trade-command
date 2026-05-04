/**
 * E-mails de rotina fotográfica:
 * - Para o operador: lista os talhões dele que estão atrasados ou vencendo em breve.
 * - Digest interno: para o time Luma com visão consolidada de todas as fazendas.
 */

import { SMTP_FROM, shouldSkipSmtp, smtpTransport } from './transport';

type PlotEntry = {
  plotName: string;
  crop: string;
  status: 'OVERDUE' | 'DUE_SOON' | 'NEVER_SUBMITTED';
  daysSinceLastSubmission: number | null;
  cadenceDays: number | null;
};

const STATUS_LABEL: Record<PlotEntry['status'], string> = {
  OVERDUE: 'ATRASADA',
  DUE_SOON: 'vence em breve',
  NEVER_SUBMITTED: 'aguardando 1ª submissão',
};

export async function sendOperatorReminder(input: {
  to: string;
  operatorName: string;
  originName: string;
  originSlug: string;
  baseUrl: string;
  plots: PlotEntry[];
}): Promise<void> {
  if (shouldSkipSmtp() || input.plots.length === 0) return;

  const link = `${input.baseUrl}/field/${input.originSlug}`;
  const lines = input.plots.map((p) => {
    const since =
      p.daysSinceLastSubmission != null
        ? ` (há ${p.daysSinceLastSubmission} dias)`
        : '';
    return `  • ${p.plotName} (${p.crop}) — ${STATUS_LABEL[p.status]}${since}`;
  });

  await smtpTransport().sendMail({
    from: SMTP_FROM,
    to: input.to,
    subject: `Rotina fotográfica — ${input.plots.length} talh${
      input.plots.length === 1 ? 'ão pendente' : 'ões pendentes'
    } em ${input.originName}`,
    text: [
      `Olá ${input.operatorName},`,
      ``,
      `Os seguintes talhões precisam de submissão de fotos:`,
      ``,
      ...lines,
      ``,
      `Acesse: ${link}`,
    ].join('\n'),
  });
}

export async function sendInternalDigest(input: {
  to: string;
  baseUrl: string;
  origins: Array<{
    originName: string;
    originSlug: string;
    plots: PlotEntry[];
  }>;
}): Promise<void> {
  if (shouldSkipSmtp() || input.origins.length === 0) return;

  const totalPlots = input.origins.reduce((acc, o) => acc + o.plots.length, 0);
  if (totalPlots === 0) return;

  const blocks = input.origins.map((o) => {
    const lines = o.plots.map((p) => {
      const since =
        p.daysSinceLastSubmission != null
          ? ` (há ${p.daysSinceLastSubmission} dias)`
          : '';
      return `    • ${p.plotName} (${p.crop}) — ${STATUS_LABEL[p.status]}${since}`;
    });
    return [
      `  ${o.originName} — ${input.baseUrl}/admin/origins/${o.originSlug}`,
      ...lines,
    ].join('\n');
  });

  await smtpTransport().sendMail({
    from: SMTP_FROM,
    to: input.to,
    subject: `[Luma] Rotinas pendentes — ${totalPlots} talhões em ${input.origins.length} fazenda${
      input.origins.length === 1 ? '' : 's'
    }`,
    text: [
      `Resumo diário de rotinas fotográficas pendentes.`,
      ``,
      ...blocks,
      ``,
      `Painel: ${input.baseUrl}/admin/origins`,
    ].join('\n\n'),
  });
}
