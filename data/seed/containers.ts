/**
 * Tipos de container seed. Alinhado com enum Prisma ContainerCode.
 * Dimensões internas aproximadas (mercado padrão).
 */

export type ContainerCode = 'C_20_RF' | 'C_40_RF' | 'C_40_HC_RF' | 'C_20_DR' | 'C_40_DR';

export type SeedContainerType = {
  code: ContainerCode;
  displayName: string;
  displayNamePtBr: string;
  /** Dimensões internas aproximadas em metros */
  internalLengthM: number;
  internalWidthM: number;
  internalHeightM: number;
  maxPayloadKg: number;
  /** Slots de pallet padrão (pallet EUR 1.20 × 0.80 m, 1 nível) */
  maxPallets: number;
  supportsReefer: boolean;
  defaultTempC: number | null;
};

export const seedContainerTypes: SeedContainerType[] = [
  {
    code: 'C_20_RF',
    displayName: "20' Reefer",
    displayNamePtBr: "20' Reefer",
    internalLengthM: 5.44,
    internalWidthM: 2.29,
    internalHeightM: 2.27,
    maxPayloadKg: 27_400,
    maxPallets: 10,
    supportsReefer: true,
    defaultTempC: 4,
  },
  {
    code: 'C_40_RF',
    displayName: "40' Reefer",
    displayNamePtBr: "40' Reefer",
    internalLengthM: 11.56,
    internalWidthM: 2.28,
    internalHeightM: 2.25,
    maxPayloadKg: 29_520,
    maxPallets: 22,
    supportsReefer: true,
    defaultTempC: 4,
  },
  {
    code: 'C_40_HC_RF',
    displayName: "40' High Cube Reefer",
    displayNamePtBr: "40' High Cube Reefer",
    internalLengthM: 11.57,
    internalWidthM: 2.29,
    internalHeightM: 2.51,
    maxPayloadKg: 29_400,
    maxPallets: 22,
    supportsReefer: true,
    defaultTempC: 4,
  },
  {
    code: 'C_20_DR',
    displayName: "20' Dry",
    displayNamePtBr: "20' Dry",
    internalLengthM: 5.9,
    internalWidthM: 2.35,
    internalHeightM: 2.39,
    maxPayloadKg: 28_230,
    maxPallets: 11,
    supportsReefer: false,
    defaultTempC: null,
  },
  {
    code: 'C_40_DR',
    displayName: "40' Dry",
    displayNamePtBr: "40' Dry",
    internalLengthM: 12.03,
    internalWidthM: 2.35,
    internalHeightM: 2.39,
    maxPayloadKg: 28_800,
    maxPallets: 25,
    supportsReefer: false,
    defaultTempC: null,
  },
];

export function findContainer(code: ContainerCode): SeedContainerType | undefined {
  return seedContainerTypes.find((c) => c.code === code);
}
