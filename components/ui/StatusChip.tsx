'use client';

import { useLocale } from 'next-intl';

import {
  availabilityStatusLabels,
  complianceGateStatusLabels,
  proposalStatusLabels,
  type StatusLabel,
} from '@/lib/status/enums';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

/**
 * Paleta semântica para status. Combina com a paleta Luma (off-white,
 * olive, sand, field, earth, sun, ink). Nenhum vermelho gritante — quando
 * é "não disponível", usamos terra/ink.
 */
type Tone = 'positive' | 'pending' | 'caution' | 'neutral' | 'closed';

const toneClasses: Record<Tone, string> = {
  positive:
    'bg-[hsl(var(--luma-field)_/_0.18)] text-[hsl(var(--luma-olive))] ring-1 ring-inset ring-[hsl(var(--luma-olive)_/_0.22)]',
  pending:
    'bg-[hsl(var(--luma-sun)_/_0.18)] text-[hsl(var(--luma-earth))] ring-1 ring-inset ring-[hsl(var(--luma-sun)_/_0.35)]',
  caution:
    'bg-[hsl(var(--luma-earth)_/_0.14)] text-[hsl(var(--luma-earth))] ring-1 ring-inset ring-[hsl(var(--luma-earth)_/_0.3)]',
  neutral:
    'bg-[hsl(var(--luma-sand)_/_0.5)] text-[hsl(var(--luma-ink)_/_0.75)] ring-1 ring-inset ring-[hsl(var(--luma-ink)_/_0.1)]',
  closed:
    'bg-[hsl(var(--luma-ink)_/_0.08)] text-[hsl(var(--luma-ink)_/_0.55)] ring-1 ring-inset ring-[hsl(var(--luma-ink)_/_0.15)]',
};

const availabilityTone: Record<string, Tone> = {
  AVAILABLE_NOW: 'positive',
  PRE_RESERVE_OPEN: 'pending',
  UNDER_TECHNICAL_VALIDATION: 'caution',
  LIMITED_AVAILABILITY: 'pending',
  UNDER_CONSULTATION: 'caution',
  NOT_AVAILABLE_FOR_DESTINATION: 'closed',
};

const complianceTone: Record<string, Tone> = {
  PREVIEW_AVAILABLE: 'neutral',
  REQUIREMENTS_PENDING: 'pending',
  DOCUMENTATION_REQUIRED: 'caution',
  SUBJECT_TO_FINAL_VALIDATION: 'caution',
  BLOCKED: 'closed',
  CLEARED_INTERNALLY: 'positive',
};

const proposalTone: Record<string, Tone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'pending',
  UNDER_COMMERCIAL_REVIEW: 'pending',
  UNDER_OPERATIONAL_REVIEW: 'pending',
  DOCUMENTATION_REVIEW_REQUIRED: 'caution',
  ADJUSTMENT_REQUESTED: 'caution',
  APPROVED_FOR_NEGOTIATION: 'positive',
  REJECTED: 'closed',
  CONVERTED_TO_OPERATION: 'positive',
};

type Kind = 'availability' | 'compliance' | 'proposal';

function labelFor(kind: Kind, code: string, locale: Locale): string {
  let map: Record<string, StatusLabel> | undefined;
  switch (kind) {
    case 'availability':
      map = availabilityStatusLabels;
      break;
    case 'compliance':
      map = complianceGateStatusLabels;
      break;
    case 'proposal':
      map = proposalStatusLabels;
      break;
  }
  return map?.[code]?.[locale] ?? code;
}

function toneFor(kind: Kind, code: string): Tone {
  if (kind === 'availability') return availabilityTone[code] ?? 'neutral';
  if (kind === 'compliance') return complianceTone[code] ?? 'neutral';
  if (kind === 'proposal') return proposalTone[code] ?? 'neutral';
  return 'neutral';
}

export type StatusChipProps = {
  kind: Kind;
  code: string;
  size?: 'sm' | 'md';
  className?: string;
};

export function StatusChip({ kind, code, size = 'sm', className }: StatusChipProps) {
  const locale = useLocale() as Locale;
  const tone = toneFor(kind, code);
  const label = labelFor(kind, code, locale);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium tracking-tight whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-xs',
        toneClasses[tone],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          tone === 'positive' && 'bg-luma-olive',
          tone === 'pending' && 'bg-luma-sun',
          tone === 'caution' && 'bg-luma-earth',
          tone === 'neutral' && 'bg-luma-ink/40',
          tone === 'closed' && 'bg-luma-ink/30',
        )}
      />
      {label}
    </span>
  );
}
