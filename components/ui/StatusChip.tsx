'use client';

import { useLocale } from 'next-intl';

import {
  dealRoomStatusLabels,
  dealTemplateLabels,
  verificationStatusLabels,
  type StatusLabel,
} from '@/lib/status/enums';
import type { Locale } from '@/lib/i18n/config';
import { Badge, type BadgeProps } from '@/components/ui/Badge';

type ChipKind = 'verification' | 'dealTemplate' | 'dealRoom';

const tables: Record<ChipKind, Record<string, StatusLabel>> = {
  verification: verificationStatusLabels,
  dealTemplate: dealTemplateLabels,
  dealRoom: dealRoomStatusLabels,
};

const variantByValue: Record<string, BadgeProps['variant']> = {
  DOC_VERIFIED: 'verified',
  EMAIL_VERIFIED: 'outline',
  UNVERIFIED: 'muted',
  CONFIRMED: 'verified',
  DISPUTED: 'warning',
  CANCELLED: 'muted',
};

export function StatusChip({
  kind,
  value,
}: {
  kind: ChipKind;
  value: string;
}) {
  const locale = useLocale() as Locale;
  const label = tables[kind][value]?.[locale] ?? value;
  return <Badge variant={variantByValue[value] ?? 'default'}>{label}</Badge>;
}
