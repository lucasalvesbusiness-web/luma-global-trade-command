'use client';

import { create } from 'zustand';

import type { DiscoverySearchInput } from '@/server/trpc/routers/discovery';

export type CompanySize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
export type DeliveryMode = 'LOCAL' | 'REMOTE' | 'HYBRID';
export type TargetSegment =
  | 'SMB'
  | 'MID_MARKET'
  | 'ENTERPRISE'
  | 'GOVERNMENT'
  | 'CONSUMER_RETAIL';

type DiscoveryFilters = {
  query: string;
  categories: string[];
  subcategories: string[];
  modalities: Array<'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY'>;
  minVerification: 'UNVERIFIED' | 'EMAIL_VERIFIED' | 'DOC_VERIFIED';
  companySizes: CompanySize[];
  deliveryModes: DeliveryMode[];
  targetSegments: TargetSegment[];
  minConfirmedDeals?: number;
  hasEvidence: boolean;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
};

type DiscoveryState = {
  filters: DiscoveryFilters;
  hoveredId: string | null;
  selectedId: string | null;
  setFilter<K extends keyof DiscoveryFilters>(key: K, value: DiscoveryFilters[K]): void;
  setLocation(lat?: number, lng?: number, radiusKm?: number): void;
  setHover(id: string | null): void;
  setSelected(id: string | null): void;
  toAuthInput(): DiscoverySearchInput;
};

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  filters: {
    query: '',
    categories: [],
    subcategories: [],
    modalities: [],
    minVerification: 'UNVERIFIED',
    companySizes: [],
    deliveryModes: [],
    targetSegments: [],
    hasEvidence: false,
  },
  hoveredId: null,
  selectedId: null,
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  setLocation: (lat, lng, radiusKm) =>
    set((s) => ({
      filters: { ...s.filters, centerLat: lat, centerLng: lng, radiusKm },
    })),
  setHover: (id) => set({ hoveredId: id }),
  setSelected: (id) => set({ selectedId: id }),
  toAuthInput: () => {
    const f = get().filters;
    return {
      query: f.query || undefined,
      categories: f.categories.length > 0 ? f.categories : undefined,
      subcategories: f.subcategories.length > 0 ? f.subcategories : undefined,
      modalities: f.modalities.length > 0 ? f.modalities : undefined,
      minVerification: f.minVerification === 'UNVERIFIED' ? undefined : f.minVerification,
      companySizes: f.companySizes.length > 0 ? f.companySizes : undefined,
      deliveryModes: f.deliveryModes.length > 0 ? f.deliveryModes : undefined,
      targetSegments: f.targetSegments.length > 0 ? f.targetSegments : undefined,
      minConfirmedDeals: f.minConfirmedDeals,
      hasEvidence: f.hasEvidence || undefined,
      centerLat: f.centerLat,
      centerLng: f.centerLng,
      radiusKm: f.radiusKm,
    };
  },
}));

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  SMALL: 'Pequena (1–20)',
  MEDIUM: 'Média (21–100)',
  LARGE: 'Grande (101–500)',
  ENTERPRISE: 'Enterprise (500+)',
};

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  LOCAL: 'Local',
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
};

export const TARGET_SEGMENT_LABELS: Record<TargetSegment, string> = {
  SMB: 'PME',
  MID_MARKET: 'Mid-market',
  ENTERPRISE: 'Enterprise',
  GOVERNMENT: 'Governo',
  CONSUMER_RETAIL: 'Varejo / consumidor',
};

export const WEDGE_CATEGORIES = [
  'Climatização',
  'Refrigeração',
  'Elétrica',
  'Manutenção predial',
  'Segurança eletrônica',
  'TI para PMEs',
  'Audiovisual corporativo',
  'Comunicação visual',
] as const;
