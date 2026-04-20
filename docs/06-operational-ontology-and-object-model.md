# 06 · Ontologia Operacional e Modelo de Objetos

**Estado**: canon · Fase 0 (primeira versão)
**Última atualização**: 2026-04-20

> Este documento é o **contrato canônico do domínio**. Toda tela, API e regra de negócio é uma projeção dele. Mudanças aqui são eventos versionados — nunca feitas sem ADR.

---

## 1. Princípio ontológico

O Luma Global Trade Command pensa o mundo como uma rede de **objetos operacionais** conectados. Não há "páginas" no sistema — há objetos e as janelas que os projetam. A ontologia abaixo é o mapa dessa rede.

**Metáfora-guia:**

- O mundo é o **canvas**.
- A origem é o **ativo**.
- O produto é o **passaporte**.
- O container é a **operação**.
- A proposta é o **resultado**.

## 2. Objetos de domínio (canon)

### 2.1 Identidade e acesso
- **User** — conta humana; `role` ∈ {BUYER, STAFF, ADMIN}.
- **BuyerCompany** — empresa compradora; `type` ∈ {IMPORTER, DISTRIBUTOR, WHOLESALER, RETAIL, INDUSTRY, TRADER}.
- **Buyer** — vínculo User↔BuyerCompany.
- **StaffMember** — vínculo User↔time interno; `team` ∈ {COMMERCIAL, OPERATIONS, COMPLIANCE, ADMIN}.

### 2.2 Geografia
- **Country** (`iso2` é a chave).
- **Port** — porto de destino; `kind` ∈ {SEAPORT, AIRPORT, INLAND}.
- **OriginRegion** — ex.: "Vale do São Francisco".
- **Origin** — fazenda própria, parceiro auditado ou unidade agroindustrial; `kind` ∈ {OWN_FARM, AUDITED_PARTNER, AGROINDUSTRIAL_UNIT}.
- **FieldPlot** — talhão dentro de uma Origin.
- **PackingHouse**, **ColdChamber**, **LogisticsHub** — infraestrutura associada à Origin.
- **Route** — ligação Origin → Port, com modalidade.

### 2.3 Catálogo
- **ProductCategory** — ex.: frutas frescas, polpas, agroindustrial seco.
- **Product** — unidade comercial canônica; tem faixa de temperatura, shelf life e container recomendado.
- **Variety** — variedade do produto (Palmer, Tommy Atkins, Crimson, Cavendish…); carrega embalagem (caixa, peso, pallet).

### 2.4 Disponibilidade e campo
- **Availability** — intersecção (Product × Variety × Origin × janela temporal) com `volumeTonsBand` (faixa, nunca valor exato exposto) e `status` ∈ enum operacional.
- **HarvestWindow** — janela provável de colheita, com `confidence` ∈ {LOW, MEDIUM, HIGH}.
- **FieldUpdate** — atualização observacional do campo; `stage` ∈ {PRE_PLANTING..POST_HARVEST}; `riskSummary`, `confidence`.
- **FieldPhoto** — foto ligada a um FieldUpdate; `approvedForBuyerView` é **a flag-chave** que separa o que o comprador vê do que a Luma vê.

### 2.5 Compliance
- **DocumentRequirement** — item documental (Commercial Invoice, Phytosanitary Certificate, Temperature Log…).
- **PhytosanitaryRequirement** — matriz (Product × Country) → lista de DocumentRequirement.
- **ComplianceGate** — estado do par (Product × Country); `status` ∈ enum de compliance.

### 2.6 Logística
- **ContainerType** — `code` ∈ {C_20_RF, C_40_RF, C_40_HC_RF, C_20_DR, C_40_DR}; dimensões internas, payload máx., `supportsReefer`, `defaultTempC`.
- **LoadPlan** — configuração de uma Proposal (1:1 com Proposal).
- **LoadItem** — item carregado (Product × Variety × quantidades × peso).

### 2.7 Comercial
- **Proposal** — objeto terminal do comprador; carrega destino, Incoterm e status de ciclo completo.
- **ProposalNote** — nota comercial; `kind` ∈ {INTERNAL, TO_BUYER}.
- **AuditEvent** — trilha universal de auditoria de qualquer transição sensível.

## 3. Enums operacionais

### 3.1 AvailabilityStatus
- `AVAILABLE_NOW`
- `PRE_RESERVE_OPEN`
- `UNDER_TECHNICAL_VALIDATION`
- `LIMITED_AVAILABILITY`
- `UNDER_CONSULTATION`
- `NOT_AVAILABLE_FOR_DESTINATION`

### 3.2 ProposalStatus
`DRAFT` → `SUBMITTED` → `UNDER_COMMERCIAL_REVIEW` → `UNDER_OPERATIONAL_REVIEW` → `DOCUMENTATION_REVIEW_REQUIRED` → `ADJUSTMENT_REQUESTED` → `APPROVED_FOR_NEGOTIATION` → `CONVERTED_TO_OPERATION` | `REJECTED`.

### 3.3 ComplianceGateStatus
- `PREVIEW_AVAILABLE`
- `REQUIREMENTS_PENDING`
- `DOCUMENTATION_REQUIRED`
- `SUBJECT_TO_FINAL_VALIDATION`
- `BLOCKED`
- `CLEARED_INTERNALLY`

### 3.4 ConfidenceLevel
`LOW` | `MEDIUM` | `HIGH`

### 3.5 FieldStage
`PRE_PLANTING` · `PLANTED` · `GROWING` · `FLOWERING` · `FRUITING` · `HARVEST` · `POST_HARVEST`

## 4. Relações-chave (mapa narrativo)

```
Buyer ∈ BuyerCompany ──▶ Country (destino) ──▶ Port

Product × Country ──▶ PhytosanitaryRequirement → [DocumentRequirement]
Product × Country ──▶ ComplianceGate.status

Product × Variety × Origin × janela ──▶ Availability (volumeTonsBand, status)
                                    ──▶ HarvestWindow (confidence)

Origin ──▶ FieldPlot ──▶ FieldUpdate ──▶ FieldPhoto (approvedForBuyerView)

Proposal ──▶ LoadPlan ──▶ [LoadItem(Product × Variety × qty)]
       └──▶ destino (Country, Port)
       └──▶ ProposalNote, AuditEvent
```

**Exemplo narrativo** (Rotterdam Mango Reefer Proposal):

```
Buyer "NorthSea Fresh Importers" ∈ BuyerCompany (Netherlands)
  → Destination Port: Rotterdam (NL)
  → Product: Manga / Variety: Palmer
  → Origin: Fazenda Luma Vale Norte (Vale do São Francisco)
  → HarvestWindow: Mai/2026 (confidence: HIGH)
  → Availability: 38t disponíveis + 54t próxima colheita (status: AVAILABLE_NOW)
  → Container: 40' HC Reefer, temp 10–12 °C
  → PhytosanitaryRequirement (Mango × NL): 8 documentos
  → ComplianceGate: PREVIEW_AVAILABLE
  → Proposal: status UNDER_COMMERCIAL_REVIEW
```

## 5. Regras de exposição por camada

| Camada | Vê | Não vê |
|---|---|---|
| **Public (buyer)** | `volumeTonsBand`, `status`, `confidence`, fotos aprovadas, compliance preview | Volume exato, identidade completa de parceiros, notas internas |
| **Internal (staff Luma)** | Tudo da public + volume exato + notas internas + audit trail | Credenciais, chaves de API |
| **Admin (Luma/Spectre)** | CRUD de todos os objetos, gestão de usuários | — |

## 6. Invariantes de domínio

- `Availability.volumeTonsBand` é **sempre faixa textual** ("20–40 t"), nunca decimal na camada pública.
- `FieldPhoto` só aparece em superfícies públicas se `approvedForBuyerView = true` E `approvedByUserId` não-nulo.
- `ComplianceGate.status` público é limitado a `PREVIEW_AVAILABLE` e `DOCUMENTATION_REQUIRED`; os demais são internos.
- `Proposal` em status ≠ `DRAFT` não pode alterar `LoadPlan.items` sem gerar `AuditEvent` de tipo ajuste.
- `ContainerType.code` dry (C_20_DR, C_40_DR) não pode receber LoadItem de Product cujo `recommendedContainerKind` seja reefer, sem alerta explícito.
- `Product.recommendedContainerKind` frozen não pode coexistir com fresh no mesmo `LoadPlan` sem alerta de revisão.

## 7. Evolução

- Adicionar objeto → ADR + migration Prisma + atualização deste documento.
- Renomear enum → proibido após F2. Criar novo + migração + deprecar antigo.
- Remover objeto → apenas após 2 fases sem uso, com ADR.

---

**Fonte de verdade técnica**: `prisma/schema.prisma` reflete esta ontologia 1:1. Se houver divergência, este documento é o árbitro; o schema deve ser reconciliado.
