'use client';

import { create } from 'zustand';

import type { DiscoverySearchInput } from '@/server/trpc/routers/discovery';

type DiscoveryFilters = {
  query: string;
  categories: string[];
  modalities: Array<'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY'>;
  minVerification: 'UNVERIFIED' | 'EMAIL_VERIFIED' | 'DOC_VERIFIED';
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
    modalities: [],
    minVerification: 'UNVERIFIED',
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
      modalities: f.modalities.length > 0 ? f.modalities : undefined,
      minVerification: f.minVerification === 'UNVERIFIED' ? undefined : f.minVerification,
      centerLat: f.centerLat,
      centerLng: f.centerLng,
      radiusKm: f.radiusKm,
    };
  },
}));

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
