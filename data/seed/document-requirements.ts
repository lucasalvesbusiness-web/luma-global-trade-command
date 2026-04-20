/**
 * Tipos documentais base. São os "blocos" que uma PhytosanitaryRequirement
 * (produto × país) combina. Códigos curtos para referência interna.
 *
 * Importante (regra de negócio R9 do briefing):
 * toda lista exibida ao comprador é *preview*. A validação final é da Luma.
 */

export type SeedDocumentRequirement = {
  code: string;
  name: string;
  namePtBr: string;
  notes?: string;
};

export const seedDocumentRequirements: SeedDocumentRequirement[] = [
  { code: 'INVOICE', name: 'Commercial Invoice', namePtBr: 'Fatura Comercial' },
  { code: 'PACKING_LIST', name: 'Packing List', namePtBr: 'Romaneio de embarque' },
  { code: 'BL', name: 'Bill of Lading', namePtBr: 'Conhecimento de Embarque (BL)' },
  { code: 'CO', name: 'Certificate of Origin', namePtBr: 'Certificado de Origem' },
  { code: 'PHYTO', name: 'Phytosanitary Certificate', namePtBr: 'Certificado Fitossanitário' },
  { code: 'EXPORT_DECL', name: 'Export Declaration', namePtBr: 'Declaração de Exportação' },
  { code: 'TEMP_LOG', name: 'Temperature Log', namePtBr: 'Log de Temperatura' },
  { code: 'QUALITY_INSPECT', name: 'Quality Inspection Report', namePtBr: 'Laudo de Inspeção de Qualidade' },
  { code: 'MRL', name: 'MRL Analysis', namePtBr: 'Análise de Resíduos (MRL)' },
  { code: 'MICRO', name: 'Microbiological Report', namePtBr: 'Laudo Microbiológico' },
  { code: 'FROZEN_CHAIN', name: 'Frozen Chain Declaration', namePtBr: 'Declaração de Cadeia Congelada' },
  { code: 'TRACE_BATCH', name: 'Traceability Batch Report', namePtBr: 'Relatório de Rastreabilidade por Lote' },
  { code: 'QUALITY_REPORT', name: 'Quality Report', namePtBr: 'Laudo de Qualidade' },
  { code: 'BUYER_SPECIFIC', name: 'Buyer Specific Requirements', namePtBr: 'Requisitos Específicos do Comprador' },
];

/**
 * Matriz (produto × país) → requisitos. Cobertura completa para os 6 países
 * seed × 7 produtos seed. Base do Compliance Preview do comprador.
 *
 * ⚠ PREVIEW. A Luma valida a lista completa internamente.
 */
export type SeedPhytoRequirement = {
  productSlug: string;
  countryIso2: string;
  documentCodes: string[]; // referência a SeedDocumentRequirement.code
  notesPtBr?: string;
  notesEn?: string;
};

const BASE_DOCS = ['INVOICE', 'PACKING_LIST', 'BL', 'CO'];

export const seedPhytoRequirements: SeedPhytoRequirement[] = [
  // ===== Manga =====
  {
    productSlug: 'mango',
    countryIso2: 'NL',
    documentCodes: [...BASE_DOCS, 'PHYTO', 'MRL', 'QUALITY_INSPECT', 'TEMP_LOG'],
    notesPtBr: 'Exige MRL conforme regulamentação europeia vigente.',
    notesEn: 'MRL analysis required per current EU regulation.',
  },
  {
    productSlug: 'mango',
    countryIso2: 'ES',
    documentCodes: [...BASE_DOCS, 'PHYTO', 'MRL', 'TRACE_BATCH', 'TEMP_LOG'],
  },
  {
    productSlug: 'mango',
    countryIso2: 'PT',
    documentCodes: [...BASE_DOCS, 'PHYTO', 'MRL', 'TEMP_LOG'],
  },
  {
    productSlug: 'mango',
    countryIso2: 'AE',
    documentCodes: [...BASE_DOCS, 'PHYTO', 'QUALITY_INSPECT', 'TEMP_LOG'],
  },
  {
    productSlug: 'mango',
    countryIso2: 'US',
    documentCodes: [...BASE_DOCS, 'PHYTO', 'MRL', 'QUALITY_INSPECT', 'TEMP_LOG', 'BUYER_SPECIFIC'],
    notesPtBr: 'Entrada sob protocolos sanitários específicos — consultar a Luma.',
    notesEn: 'Entry subject to specific sanitary protocols — consult Luma.',
  },

  // ===== Uva =====
  {
    productSlug: 'grape',
    countryIso2: 'NL',
    documentCodes: [...BASE_DOCS, 'PHYTO', 'MRL', 'TRACE_BATCH', 'TEMP_LOG'],
  },
  {
    productSlug: 'grape',
    countryIso2: 'ES',
    documentCodes: [...BASE_DOCS, 'PHYTO', 'MRL', 'TRACE_BATCH'],
  },
  {
    productSlug: 'grape',
    countryIso2: 'PT',
    documentCodes: [...BASE_DOCS, 'PHYTO', 'MRL'],
  },
  {
    productSlug: 'grape',
    countryIso2: 'AE',
    documentCodes: [...BASE_DOCS, 'PHYTO', 'QUALITY_INSPECT', 'TEMP_LOG'],
  },

  // ===== Banana =====
  {
    productSlug: 'banana',
    countryIso2: 'AE',
    documentCodes: [...BASE_DOCS, 'PHYTO', 'QUALITY_INSPECT', 'TEMP_LOG'],
  },
  {
    productSlug: 'banana',
    countryIso2: 'PT',
    documentCodes: [...BASE_DOCS, 'PHYTO', 'TEMP_LOG'],
  },
  {
    productSlug: 'banana',
    countryIso2: 'BR',
    documentCodes: ['INVOICE', 'PACKING_LIST', 'QUALITY_INSPECT'],
    notesPtBr: 'Logística nacional — sem documentação fitossanitária internacional.',
    notesEn: 'Domestic logistics — no international phytosanitary documentation.',
  },

  // ===== Polpas =====
  {
    productSlug: 'fruit-pulp',
    countryIso2: 'US',
    documentCodes: [
      ...BASE_DOCS,
      'MICRO',
      'TEMP_LOG',
      'FROZEN_CHAIN',
      'BUYER_SPECIFIC',
    ],
    notesPtBr: 'Cadeia congelada comprovada por Temperature Log + Frozen Chain Declaration.',
    notesEn: 'Frozen chain evidence via Temperature Log + Frozen Chain Declaration.',
  },
  {
    productSlug: 'fruit-pulp',
    countryIso2: 'AE',
    documentCodes: [...BASE_DOCS, 'MICRO', 'TEMP_LOG', 'FROZEN_CHAIN'],
  },
  {
    productSlug: 'fruit-pulp',
    countryIso2: 'NL',
    documentCodes: [...BASE_DOCS, 'MICRO', 'TEMP_LOG', 'FROZEN_CHAIN'],
  },

  // ===== Açaí =====
  {
    productSlug: 'acai',
    countryIso2: 'US',
    documentCodes: [
      ...BASE_DOCS,
      'MICRO',
      'TEMP_LOG',
      'FROZEN_CHAIN',
      'BUYER_SPECIFIC',
    ],
  },
  {
    productSlug: 'acai',
    countryIso2: 'AE',
    documentCodes: [...BASE_DOCS, 'MICRO', 'TEMP_LOG', 'FROZEN_CHAIN'],
  },

  // ===== Farinha =====
  {
    productSlug: 'cassava-flour',
    countryIso2: 'PT',
    documentCodes: [...BASE_DOCS, 'QUALITY_REPORT'],
  },
  {
    productSlug: 'cassava-flour',
    countryIso2: 'ES',
    documentCodes: [...BASE_DOCS, 'QUALITY_REPORT'],
  },
  {
    productSlug: 'cassava-flour',
    countryIso2: 'AE',
    documentCodes: [...BASE_DOCS, 'QUALITY_REPORT'],
  },

  // ===== Amido =====
  {
    productSlug: 'cassava-starch',
    countryIso2: 'PT',
    documentCodes: [...BASE_DOCS, 'QUALITY_REPORT'],
  },
  {
    productSlug: 'cassava-starch',
    countryIso2: 'ES',
    documentCodes: [...BASE_DOCS, 'QUALITY_REPORT'],
  },
  {
    productSlug: 'cassava-starch',
    countryIso2: 'US',
    documentCodes: [...BASE_DOCS, 'MICRO', 'QUALITY_REPORT', 'BUYER_SPECIFIC'],
  },
];

/**
 * Compliance Gate status por par (produto × país). Espelho do enum Prisma
 * ComplianceGateStatus, restrito a valores que fazem sentido em public_view.
 */
export type SeedComplianceGate = {
  productSlug: string;
  countryIso2: string;
  status:
    | 'PREVIEW_AVAILABLE'
    | 'DOCUMENTATION_REQUIRED'
    | 'SUBJECT_TO_FINAL_VALIDATION';
  notesPtBr?: string;
  notesEn?: string;
};

export const seedComplianceGates: SeedComplianceGate[] = seedPhytoRequirements.map(
  (req) => ({
    productSlug: req.productSlug,
    countryIso2: req.countryIso2,
    status: 'PREVIEW_AVAILABLE',
    notesPtBr: 'Lista preliminar — sujeita à validação final da Luma.',
    notesEn: 'Preliminary list — subject to final validation by Luma.',
  }),
);
