/**
 * Três hero fixtures — propostas narrativas que exercitam 100% do fluxo
 * comercial do MVP. Referência: briefing §8, "Propostas de Amostra".
 *
 * Cada proposta:
 * - aponta a um Buyer seed (users.ts)
 * - tem destino (country + port + incoterm)
 * - tem LoadPlan com container + items
 * - tem status no ciclo e algumas notas internas
 */

export type SeedProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_COMMERCIAL_REVIEW'
  | 'UNDER_OPERATIONAL_REVIEW'
  | 'DOCUMENTATION_REVIEW_REQUIRED'
  | 'ADJUSTMENT_REQUESTED'
  | 'APPROVED_FOR_NEGOTIATION'
  | 'REJECTED'
  | 'CONVERTED_TO_OPERATION';

export type SeedContainerCode =
  | 'C_20_RF'
  | 'C_40_RF'
  | 'C_40_HC_RF'
  | 'C_20_DR'
  | 'C_40_DR';

export type SeedLoadItem = {
  productSlug: string;
  varietyName: string | null;
  qtyBoxes: number;
  qtyPallets: number;
  totalWeightKg: number;
};

export type SeedProposalNote = {
  authorEmail: string; // email do staff user que escreveu
  team: 'COMMERCIAL' | 'OPERATIONS' | 'COMPLIANCE' | 'ADMIN' | null;
  kind: 'INTERNAL' | 'TO_BUYER';
  body: string;
  createdAtDaysOffset: number;
};

export type SeedProposal = {
  reference: string; // ex.: LUMA-2026-00001
  buyerEmail: string; // aponta ao SeedBuyer.user.email
  destinationCountryIso2: string;
  destinationPortId: string | null;
  incoterm: string | null;
  status: SeedProposalStatus;
  submittedDaysOffset: number;
  loadPlan: {
    containerCode: SeedContainerCode;
    configuredTempC: number | null;
    notes?: string;
    items: SeedLoadItem[];
  };
  notes: SeedProposalNote[];
};

export const seedProposals: SeedProposal[] = [
  // 1) Rotterdam Mango Reefer Proposal
  {
    reference: 'LUMA-2026-00001',
    buyerEmail: 'buyer-nl@northsea-fresh.local',
    destinationCountryIso2: 'NL',
    destinationPortId: 'port-rotterdam',
    incoterm: 'CFR',
    status: 'UNDER_COMMERCIAL_REVIEW',
    submittedDaysOffset: -4,
    loadPlan: {
      containerCode: 'C_40_HC_RF',
      configuredTempC: 10,
      notes: 'Mango Palmer 40\' HC Reefer — 20 pallets (~4 t por pallet).',
      items: [
        {
          productSlug: 'mango',
          varietyName: 'Palmer',
          qtyBoxes: 4000,
          qtyPallets: 20,
          totalWeightKg: 16_000,
        },
      ],
    },
    notes: [
      {
        authorEmail: 'commercial@luma.local',
        team: 'COMMERCIAL',
        kind: 'INTERNAL',
        body: 'Comprador recorrente. Último ciclo (2025 Q3) executado sem pendências. Alinhar preço FOB × CFR até fim de semana.',
        createdAtDaysOffset: -3,
      },
    ],
  },

  // 2) Dubai Mixed Frozen Proposal
  {
    reference: 'LUMA-2026-00002',
    buyerEmail: 'buyer-ae@gulf-premium.local',
    destinationCountryIso2: 'AE',
    destinationPortId: 'port-jebel-ali',
    incoterm: 'CIF',
    status: 'DOCUMENTATION_REVIEW_REQUIRED',
    submittedDaysOffset: -6,
    loadPlan: {
      containerCode: 'C_40_RF',
      configuredTempC: -18,
      notes: 'Carga mista congelada — polpa de manga + açaí.',
      items: [
        {
          productSlug: 'fruit-pulp',
          varietyName: 'Mango pulp',
          qtyBoxes: 900,
          qtyPallets: 10,
          totalWeightKg: 9_000,
        },
        {
          productSlug: 'acai',
          varietyName: 'Bag-in-box 10 kg',
          qtyBoxes: 450,
          qtyPallets: 5,
          totalWeightKg: 4_500,
        },
      ],
    },
    notes: [
      {
        authorEmail: 'compliance@luma.local',
        team: 'COMPLIANCE',
        kind: 'INTERNAL',
        body: 'Aguardando Microbiological Report da linha de açaí. Frozen Chain Declaration em revisão jurídica.',
        createdAtDaysOffset: -4,
      },
      {
        authorEmail: 'commercial@luma.local',
        team: 'COMMERCIAL',
        kind: 'TO_BUYER',
        body: 'Previsão de fechamento documental em 3–5 dias úteis. Seguimos avançando com a operação em paralelo.',
        createdAtDaysOffset: -3,
      },
    ],
  },

  // 3) Lisbon Dry Goods Proposal
  {
    reference: 'LUMA-2026-00003',
    buyerEmail: 'buyer-pt@lusitania-agro.local',
    destinationCountryIso2: 'PT',
    destinationPortId: 'port-leixoes',
    incoterm: 'FOB',
    status: 'APPROVED_FOR_NEGOTIATION',
    submittedDaysOffset: -10,
    loadPlan: {
      containerCode: 'C_40_DR',
      configuredTempC: null,
      notes: 'Carga seca — farinha + amido de mandioca.',
      items: [
        {
          productSlug: 'cassava-flour',
          varietyName: 'Fine',
          qtyBoxes: 960,
          qtyPallets: 24,
          totalWeightKg: 24_000,
        },
        {
          productSlug: 'cassava-starch',
          varietyName: 'Sweet (polvilho doce)',
          qtyBoxes: 320,
          qtyPallets: 8,
          totalWeightKg: 8_000,
        },
      ],
    },
    notes: [
      {
        authorEmail: 'operations@luma.local',
        team: 'OPERATIONS',
        kind: 'INTERNAL',
        body: 'Estoque confirmado. Janela logística OK para embarque em Santos.',
        createdAtDaysOffset: -8,
      },
      {
        authorEmail: 'commercial@luma.local',
        team: 'COMMERCIAL',
        kind: 'INTERNAL',
        body: 'Aprovado para negociação final. Enviar contrato modelo CP-A.',
        createdAtDaysOffset: -2,
      },
    ],
  },
];
