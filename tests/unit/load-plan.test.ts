import { describe, expect, it } from 'vitest';

import { evaluateLoadPlan } from '@/lib/rules/load-plan';
import type { LoadPlanItem } from '@/lib/canvas/types';

function item(partial: Partial<LoadPlanItem>): LoadPlanItem {
  return {
    localId: Math.random().toString(),
    productSlug: 'mango',
    productName: 'Mango',
    varietyId: 'v1',
    varietyName: 'Palmer',
    boxWeightKg: 4,
    recommendedContainerKind: 'REEFER_40_HC',
    tempRangeMinC: 10,
    tempRangeMaxC: 12,
    qtyBoxes: 200,
    qtyPallets: 1,
    ...partial,
  };
}

describe('evaluateLoadPlan', () => {
  it('returns zero metrics and no alerts when empty + no container', () => {
    const r = evaluateLoadPlan(null, []);
    expect(r.metrics.totalBoxes).toBe(0);
    expect(r.alerts).toHaveLength(0);
  });

  it('flags EMPTY_LOAD when container is set but no items', () => {
    const r = evaluateLoadPlan('C_40_HC_RF', []);
    expect(r.alerts.find((a) => a.code === 'EMPTY_LOAD')).toBeTruthy();
  });

  it('computes totalWeight = sum(qtyBoxes * boxWeightKg)', () => {
    const r = evaluateLoadPlan('C_40_HC_RF', [
      item({ qtyBoxes: 200, boxWeightKg: 4 }),
      item({ qtyBoxes: 100, boxWeightKg: 6 }),
    ]);
    expect(r.metrics.totalWeightKg).toBe(1400);
  });

  it('flags OVERWEIGHT when weight exceeds container payload', () => {
    const r = evaluateLoadPlan('C_40_HC_RF', [
      item({ qtyBoxes: 10_000, boxWeightKg: 4 }), // 40 000 kg > 29 400 kg
    ]);
    expect(r.alerts.find((a) => a.code === 'OVERWEIGHT')).toBeTruthy();
  });

  it('flags OVER_PALLETS when pallets exceed container capacity', () => {
    const r = evaluateLoadPlan('C_40_HC_RF', [
      item({ qtyPallets: 30 }), // 30 > 22
    ]);
    expect(r.alerts.find((a) => a.code === 'OVER_PALLETS')).toBeTruthy();
  });

  it('flags FROZEN_FRESH_MIX when items have incompatible temps', () => {
    const r = evaluateLoadPlan('C_40_RF', [
      item({ tempRangeMinC: -18, tempRangeMaxC: -18 }),
      item({ tempRangeMinC: 10, tempRangeMaxC: 12 }),
    ]);
    expect(r.alerts.find((a) => a.code === 'FROZEN_FRESH_MIX')).toBeTruthy();
  });

  it('flags TEMPERATURE_CONFLICT for non-overlapping ranges (same family)', () => {
    const r = evaluateLoadPlan('C_40_RF', [
      item({ tempRangeMinC: 0, tempRangeMaxC: 2 }), // grape
      item({ tempRangeMinC: 13, tempRangeMaxC: 14 }), // banana
    ]);
    expect(r.alerts.find((a) => a.code === 'TEMPERATURE_CONFLICT')).toBeTruthy();
  });

  it('no temperature conflict when ranges overlap', () => {
    const r = evaluateLoadPlan('C_40_HC_RF', [
      item({ tempRangeMinC: 10, tempRangeMaxC: 14 }),
      item({ tempRangeMinC: 12, tempRangeMaxC: 16 }),
    ]);
    expect(r.alerts.find((a) => a.code === 'TEMPERATURE_CONFLICT')).toBeFalsy();
  });

  it('flags DRY_REEFER_MISMATCH when putting refrigerated item in dry container', () => {
    const r = evaluateLoadPlan('C_40_DR', [
      item({ tempRangeMinC: 10, tempRangeMaxC: 12 }), // mango in dry
    ]);
    const alert = r.alerts.find((a) => a.code === 'DRY_REEFER_MISMATCH');
    expect(alert?.severity).toBe('critical');
  });

  it('info when only dry goods loaded in reefer', () => {
    const r = evaluateLoadPlan('C_40_RF', [
      item({ tempRangeMinC: null, tempRangeMaxC: null }), // cassava flour
    ]);
    const alert = r.alerts.find((a) => a.code === 'DRY_REEFER_MISMATCH');
    expect(alert?.severity).toBe('info');
  });

  it('occupationPct is the max of weight and pallet utilization', () => {
    const r = evaluateLoadPlan('C_40_HC_RF', [
      item({ qtyBoxes: 1000, boxWeightKg: 4, qtyPallets: 5 }), // 4000 kg / 29 400 ≈ 0.136 vs 5/22 ≈ 0.227
    ]);
    expect(r.metrics.occupationPct).toBeCloseTo(5 / 22, 3);
  });
});
