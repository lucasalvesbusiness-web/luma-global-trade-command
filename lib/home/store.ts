'use client';

import { create } from 'zustand';

const RADIUS_OPTIONS_KM = [1, 2, 5, 10, 25, 100, 500] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS_KM)[number];
export { RADIUS_OPTIONS_KM };

type HomeState = {
  hoveredCompanyId: string | null;
  selectedCompanyId: string | null;
  radiusKm: RadiusKm;
  setHovered(id: string | null): void;
  setSelected(id: string | null): void;
  setRadius(km: RadiusKm): void;
};

const STORAGE_KEY = 'lastro:home:radius-km';

function loadInitialRadius(): RadiusKm {
  if (typeof window === 'undefined') return 5;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return 5;
  const parsed = Number(raw);
  return (RADIUS_OPTIONS_KM as readonly number[]).includes(parsed)
    ? (parsed as RadiusKm)
    : 5;
}

export const useHomeStore = create<HomeState>((set) => ({
  hoveredCompanyId: null,
  selectedCompanyId: null,
  radiusKm: 5,
  setHovered: (id) => set({ hoveredCompanyId: id }),
  setSelected: (id) => set({ selectedCompanyId: id }),
  setRadius: (km) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(km));
      } catch {
        // ignore
      }
    }
    set({ radiusKm: km });
  },
}));

/**
 * Call once on mount in a client component to hydrate radius from localStorage.
 * Avoids SSR mismatch.
 */
export function useHydrateRadius() {
  if (typeof window === 'undefined') return;
  const initial = loadInitialRadius();
  const current = useHomeStore.getState().radiusKm;
  if (initial !== current) {
    useHomeStore.setState({ radiusKm: initial });
  }
}
