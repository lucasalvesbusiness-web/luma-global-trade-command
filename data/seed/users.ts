/**
 * Usuários seed para o MVP.
 * - Staff Luma cobre os 3 times (commercial / operations / compliance) + admin.
 * - 3 buyers correspondem aos 3 hero proposals.
 *
 * IMPORTANTE: estes usuários não têm senha — auth do MVP é magic link
 * (Auth.js + Mailpit). O login é feito pelo e-mail; a sessão é criada
 * quando o comprador clica no link.
 */

export type SeedUserRole = 'BUYER' | 'STAFF' | 'ADMIN';
export type SeedStaffTeam = 'COMMERCIAL' | 'OPERATIONS' | 'COMPLIANCE' | 'ADMIN';

export type SeedStaffUser = {
  email: string;
  name: string;
  role: 'STAFF' | 'ADMIN';
  team: SeedStaffTeam;
  title?: string;
  locale: 'pt-br' | 'en';
};

export const seedStaffUsers: SeedStaffUser[] = [
  {
    email: 'admin@luma.local',
    name: 'Luma Admin',
    role: 'ADMIN',
    team: 'ADMIN',
    title: 'Plataforma Luma × Spectre',
    locale: 'pt-br',
  },
  {
    email: 'commercial@luma.local',
    name: 'Ana Comercial',
    role: 'STAFF',
    team: 'COMMERCIAL',
    title: 'Comercial exportação',
    locale: 'pt-br',
  },
  {
    email: 'operations@luma.local',
    name: 'Rafael Operações',
    role: 'STAFF',
    team: 'OPERATIONS',
    title: 'Operações de origem',
    locale: 'pt-br',
  },
  {
    email: 'compliance@luma.local',
    name: 'Júlia Conformidade',
    role: 'STAFF',
    team: 'COMPLIANCE',
    title: 'Qualidade e documentação',
    locale: 'pt-br',
  },
];

export type SeedBuyerCompanyType =
  | 'IMPORTER'
  | 'DISTRIBUTOR'
  | 'WHOLESALER'
  | 'RETAIL'
  | 'INDUSTRY'
  | 'TRADER';

export type SeedBuyer = {
  user: {
    email: string;
    name: string;
    locale: 'pt-br' | 'en';
  };
  company: {
    legalName: string;
    displayName: string;
    type: SeedBuyerCompanyType;
    countryIso2: string;
    city: string | null;
    address: string | null;
    defaultPortId: string | null;
    defaultIncoterm: string | null;
    estimatedMonthlyVolume: string | null;
  };
};

/** Buyers alinhados aos 3 hero proposals. */
export const seedBuyers: SeedBuyer[] = [
  {
    user: {
      email: 'buyer-nl@northsea-fresh.local',
      name: 'Margriet van Dijk',
      locale: 'en',
    },
    company: {
      legalName: 'NorthSea Fresh Importers B.V.',
      displayName: 'NorthSea Fresh',
      type: 'IMPORTER',
      countryIso2: 'NL',
      city: 'Rotterdam',
      address: 'Waalhaven Z.z. 12, 3089 JH Rotterdam',
      defaultPortId: 'port-rotterdam',
      defaultIncoterm: 'CFR',
      estimatedMonthlyVolume: '40–100 t',
    },
  },
  {
    user: {
      email: 'buyer-ae@gulf-premium.local',
      name: 'Omar Al-Rashid',
      locale: 'en',
    },
    company: {
      legalName: 'Gulf Premium Foods LLC',
      displayName: 'Gulf Premium Foods',
      type: 'DISTRIBUTOR',
      countryIso2: 'AE',
      city: 'Dubai',
      address: 'Jebel Ali Free Zone, JAFZA North, Dubai',
      defaultPortId: 'port-jebel-ali',
      defaultIncoterm: 'CIF',
      estimatedMonthlyVolume: '20–40 t',
    },
  },
  {
    user: {
      email: 'buyer-pt@lusitania-agro.local',
      name: 'João Mendes',
      locale: 'pt-br',
    },
    company: {
      legalName: 'Lusitania Agro Distribution Lda.',
      displayName: 'Lusitania Agro',
      type: 'WHOLESALER',
      countryIso2: 'PT',
      city: 'Leixões',
      address: 'Porto de Leixões, terminal norte',
      defaultPortId: 'port-leixoes',
      defaultIncoterm: 'FOB',
      estimatedMonthlyVolume: '100+ t',
    },
  },
];
