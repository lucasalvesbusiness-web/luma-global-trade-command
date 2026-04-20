import { describe, expect, it } from 'vitest';

import { evaluateProductAvailability } from '@/lib/rules/product-availability';
import type {
  AvailabilitySummary,
  CompliancePreview,
} from '@/server/repositories/types';

function avail(partial: Partial<AvailabilitySummary>): AvailabilitySummary {
  return {
    id: 'id-' + Math.random(),
    productSlug: 'mango',
    productName: 'Mango',
    varietyName: null,
    originSlug: 'origin-1',
    originName: 'Origin',
    volumeTonsBand: '20–40 t',
    status: 'AVAILABLE_NOW',
    validFrom: new Date(),
    validTo: new Date(),
    notes: null,
    ...partial,
  };
}

function preview(partial: Partial<CompliancePreview>): CompliancePreview {
  return {
    productSlug: 'mango',
    productName: 'Mango',
    countryIso2: 'NL',
    countryName: 'Netherlands',
    status: 'PREVIEW_AVAILABLE',
    documents: [],
    notes: null,
    ...partial,
  };
}

describe('evaluateProductAvailability', () => {
  it('returns NOT_AVAILABLE when no availability and no compliance preview', () => {
    const r = evaluateProductAvailability('mango', [], null);
    expect(r.effectiveStatus).toBe('NOT_AVAILABLE_FOR_DESTINATION');
    expect(r.reason).toBe('NO_AVAILABILITY');
  });

  it('returns UNDER_CONSULTATION when availability exists but no preview for destination', () => {
    const r = evaluateProductAvailability('mango', [avail({})], null);
    expect(r.effectiveStatus).toBe('UNDER_CONSULTATION');
    expect(r.reason).toBe('NO_COMPLIANCE_PREVIEW');
  });

  it('returns NOT_AVAILABLE when compliance is BLOCKED', () => {
    const r = evaluateProductAvailability(
      'mango',
      [avail({ status: 'AVAILABLE_NOW' })],
      preview({ status: 'BLOCKED' }),
    );
    expect(r.effectiveStatus).toBe('NOT_AVAILABLE_FOR_DESTINATION');
    expect(r.reason).toBe('COMPLIANCE_BLOCKED');
  });

  it('picks the best status among multiple availabilities', () => {
    const r = evaluateProductAvailability(
      'mango',
      [
        avail({ id: 'a', status: 'PRE_RESERVE_OPEN' }),
        avail({ id: 'b', status: 'AVAILABLE_NOW' }),
        avail({ id: 'c', status: 'LIMITED_AVAILABILITY' }),
      ],
      preview({ status: 'PREVIEW_AVAILABLE' }),
    );
    expect(r.effectiveStatus).toBe('AVAILABLE_NOW');
  });

  it('downgrades AVAILABLE_NOW to UNDER_TECHNICAL_VALIDATION when compliance is partial', () => {
    const r = evaluateProductAvailability(
      'mango',
      [avail({ status: 'AVAILABLE_NOW' })],
      preview({ status: 'DOCUMENTATION_REQUIRED' }),
    );
    expect(r.effectiveStatus).toBe('UNDER_TECHNICAL_VALIDATION');
  });

  it('ignores availabilities from other products', () => {
    const r = evaluateProductAvailability(
      'grape',
      [avail({ productSlug: 'mango', status: 'AVAILABLE_NOW' })],
      preview({ productSlug: 'grape', status: 'PREVIEW_AVAILABLE' }),
    );
    expect(r.effectiveStatus).toBe('UNDER_CONSULTATION');
  });
});
