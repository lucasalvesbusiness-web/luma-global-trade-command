'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { findContainer } from '@/data/seed/containers';

import {
  emptyBuyer,
  emptyDestination,
  emptyLoadPlan,
  type BuyerDraft,
  type CanvasStage,
  type ContainerCode,
  type DestinationDraft,
  type Incoterm,
  type LoadPlanDraft,
  type LoadPlanItem,
  type VolumeBand,
} from './types';

type CanvasState = {
  stage: CanvasStage;
  destination: DestinationDraft;
  hoveredCountryIso2: string | null;
  selectedProductSlug: string | null;
  loadPlan: LoadPlanDraft;
  builderOpen: boolean;
  buyer: BuyerDraft;
  reviewOpen: boolean;
  /** Indica que o ValeMap carregou e pode receber overlays (ProductRail, Tray). */
  valeMapReady: boolean;
  submission: {
    status: 'idle' | 'submitting' | 'submitted' | 'error';
    reference: string | null;
    errorMessage: string | null;
  };

  // transitions
  startSelection: () => void;
  setCountry: (iso2: string) => void;
  setPort: (portId: string) => void;
  setCity: (cityId: string) => void;
  setIncoterm: (incoterm: Incoterm) => void;
  setVolume: (volume: VolumeBand) => void;
  confirmDestination: () => void;
  revealOrigin: () => void;
  resetToIntro: () => void;
  setHoveredCountry: (iso2: string | null) => void;

  // product passport
  openPassport: (slug: string) => void;
  closePassport: () => void;

  // load plan / container builder
  setContainer: (code: ContainerCode | null) => void;
  setConfiguredTemp: (tempC: number | null) => void;
  addLoadItem: (item: Omit<LoadPlanItem, 'localId'>) => void;
  updateLoadItem: (localId: string, patch: Partial<LoadPlanItem>) => void;
  removeLoadItem: (localId: string) => void;
  clearLoadPlan: () => void;
  openBuilder: () => void;
  closeBuilder: () => void;

  // review / submission
  updateBuyer: (patch: Partial<BuyerDraft>) => void;
  openReview: () => void;
  closeReview: () => void;
  setSubmissionStatus: (status: CanvasState['submission']) => void;
  setValeMapReady: (ready: boolean) => void;

  // selectors
  isDestinationComplete: () => boolean;
  isBuyerComplete: () => boolean;
};

export const useCanvasStore = create<CanvasState>()(
  subscribeWithSelector((set, get) => ({
    stage: 'intro',
    destination: { ...emptyDestination },
    hoveredCountryIso2: null,
    selectedProductSlug: null,
    loadPlan: { ...emptyLoadPlan, items: [] },
    builderOpen: false,
    buyer: { ...emptyBuyer },
    reviewOpen: false,
    valeMapReady: false,
    submission: { status: 'idle', reference: null, errorMessage: null },

    startSelection: () => set({ stage: 'destinationSelection' }),

    setCountry: (iso2) =>
      set((state) => {
        const countryChanged = state.destination.countryIso2 !== iso2;
        return {
          stage:
            state.stage === 'intro' ? 'destinationSelection' : state.stage,
          destination: {
            ...state.destination,
            countryIso2: iso2,
            // reset port e city quando o país muda
            portId: countryChanged ? null : state.destination.portId,
            cityId: countryChanged ? null : state.destination.cityId,
          },
        };
      }),

    setPort: (portId) =>
      set((state) => ({
        destination: { ...state.destination, portId },
      })),

    setCity: (cityId) =>
      set((state) => ({
        destination: { ...state.destination, cityId },
      })),

    setIncoterm: (incoterm) =>
      set((state) => ({
        destination: { ...state.destination, incoterm },
      })),

    setVolume: (volume) =>
      set((state) => ({
        destination: { ...state.destination, volume },
      })),

    confirmDestination: () => {
      if (!get().isDestinationComplete()) return;
      set({ stage: 'destinationConfirmed' });
      // Orquestração cinematográfica — fica na store para não depender do
      // ciclo de vida de nenhum componente.
      //
      // Timeline:
      //   0 ms    → destinationConfirmed  (arco começa a desenhar)
      //  400 ms  → transitToBrazil       (flyTo longo começa, ~5s)
      // 5200 ms  → originReveal          (markers + rotas revelam)
      window.setTimeout(() => {
        set({ stage: 'transitToBrazil' });
        window.setTimeout(() => {
          set({ stage: 'originReveal' });
        }, 4800);
      }, 400);
    },

    revealOrigin: () => set({ stage: 'originReveal' }),

    resetToIntro: () =>
      set({
        stage: 'intro',
        destination: { ...emptyDestination },
        hoveredCountryIso2: null,
        selectedProductSlug: null,
        loadPlan: { ...emptyLoadPlan, items: [] },
        builderOpen: false,
        buyer: { ...emptyBuyer },
        reviewOpen: false,
        valeMapReady: false,
        submission: { status: 'idle', reference: null, errorMessage: null },
      }),

    setHoveredCountry: (iso2) => set({ hoveredCountryIso2: iso2 }),

    openPassport: (slug) => set({ selectedProductSlug: slug }),
    closePassport: () => set({ selectedProductSlug: null }),

    setContainer: (code) =>
      set((state) => {
        const container = code ? findContainer(code) : null;
        return {
          loadPlan: {
            ...state.loadPlan,
            containerCode: code,
            configuredTempC: container?.defaultTempC ?? null,
          },
        };
      }),

    setConfiguredTemp: (tempC) =>
      set((state) => ({
        loadPlan: { ...state.loadPlan, configuredTempC: tempC },
      })),

    addLoadItem: (item) =>
      set((state) => {
        const localId = `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        return {
          loadPlan: {
            ...state.loadPlan,
            items: [...state.loadPlan.items, { ...item, localId }],
          },
        };
      }),

    updateLoadItem: (localId, patch) =>
      set((state) => ({
        loadPlan: {
          ...state.loadPlan,
          items: state.loadPlan.items.map((it) =>
            it.localId === localId ? { ...it, ...patch } : it,
          ),
        },
      })),

    removeLoadItem: (localId) =>
      set((state) => ({
        loadPlan: {
          ...state.loadPlan,
          items: state.loadPlan.items.filter((it) => it.localId !== localId),
        },
      })),

    clearLoadPlan: () =>
      set({ loadPlan: { ...emptyLoadPlan, items: [] } }),

    openBuilder: () => set({ builderOpen: true }),
    closeBuilder: () => set({ builderOpen: false }),

    updateBuyer: (patch) =>
      set((state) => ({ buyer: { ...state.buyer, ...patch } })),

    openReview: () => set({ reviewOpen: true, builderOpen: false }),
    closeReview: () => set({ reviewOpen: false }),

    setSubmissionStatus: (submission) => set({ submission }),

    setValeMapReady: (ready) => set({ valeMapReady: ready }),

    isDestinationComplete: () => {
      const d = get().destination;
      return Boolean(d.countryIso2 && d.portId && d.incoterm && d.volume);
    },

    isBuyerComplete: () => {
      const b = get().buyer;
      return Boolean(
        b.legalName.trim() &&
          b.type &&
          b.contactName.trim() &&
          /.+@.+\..+/.test(b.contactEmail),
      );
    },
  })),
);

