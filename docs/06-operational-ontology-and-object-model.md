# 06 — Ontologia operacional e modelo de objetos

> Documento canônico do domínio. Toda mudança de modelo deve passar primeiro por este arquivo, depois por migração Prisma, depois por código.
>
> **Versão**: 2.0 (post-pivot B2B) · **Data**: 2026-05-10 · ver ADR 0003.

## 1. Tese de domínio

A plataforma é uma **rede de confiança transacional B2B**. O domínio não é catálogo, marketplace ou rede social — é uma camada de infraestrutura onde empresas:

1. **Apresentam-se** com perfil verificável (identidade + capacidade + provas).
2. **Encontram-se** via descoberta filtrada por confiança contextual.
3. **Negociam** dentro de um deal room auditável com fluxo por modalidade.
4. **Comprovam** entrega com evidência estruturada e aceite da contraparte.
5. **Acumulam reputação** derivada de execução real, não de discurso.

Reputação = identidade + prova + execução + comportamento + contexto.

## 2. Objetos centrais (F0–F4)

### 2.1 `User`
Pessoa física com credencial (Auth.js magic link). Pertence a 0..N empresas via `CompanyMember`.

### 2.2 `Company`
Empresa transacional. CNPJ único, identidade verificável (`verificationStatus`), localização (F1: PostGIS Point + `serviceRadiusKm`), descrição PT/EN.

### 2.3 `CompanyMember`
Vínculo User ↔ Company com papel (`OWNER | COMMERCIAL | OPERATIONS | FINANCE | BUYER`). Multi-tenant: um User pode pertencer a várias Companies.

### 2.4 `ServiceOffering` (F1)
Categoria + subcategoria + modalidade (`ONE_OFF | RECURRING | PRODUCT_SUPPLY`) que a Company oferece. Wedge MVP: serviços técnicos B2B locais (climatização, refrigeração, elétrica, manutenção predial, segurança eletrônica, TI para PMEs).

### 2.5 `VerificationArtifact` (F1)
Documento de verificação (cartão CNPJ, comprovante de endereço). Hash + signed URL + revisor + status. Sem OCR no MVP — revisão manual via admin.

### 2.6 `DealRoom` (F3) — núcleo do MVP
Sala transacional entre `buyerCompany` e `supplierCompany` com `template` e FSM compartilhada de status:

```
OPENED → SCOPED → QUOTED → ACCEPTED → IN_PROGRESS → DELIVERED → CONFIRMED → CLOSED
                                                              ↘ DISPUTED
                                                              ↘ CANCELLED
```

`template` define **forma**, não enum de status. Especificidade por template fica em `scopePayload Json` validado por Zod em `lib/rules/deal-templates/{one-off,recurring,product-supply}.ts`.

### 2.7 `DeliveryCycle` (F3)
Filho de `DealRoom` template `RECURRING`. Mini-FSM `SCHEDULED → DELIVERED → CONFIRMED`. Deal pai só fecha quando todos os ciclos estão `CONFIRMED` ou `CANCELLED`.

### 2.8 `Evidence` (F3)
Prova vinculada ao deal room (e opcionalmente a um cycle). Tipo `PHOTO | DOC | SIGNATURE | INVOICE_PREVIEW`. Tem `uploadedBy` e `acceptedBy?` + `acceptedAt?`. Aceite formal da contraparte é o gatilho de transição para `CONFIRMED`.

### 2.9 `DealRoomMessage` (F3)
Chat acoplado ao deal — escopo limitado, sem rich text. Mensagens fora do deal não contam para reputação.

### 2.10 `Review` (F4)
Gerado **automaticamente** na transição para `CONFIRMED`. Bilateral. Bloqueia review fora desse contexto (guard-rail PRD §13.5). 1–5 + texto opcional + categoria contextual.

### 2.11 `CompanyReputation` (F4 — view materializada)
Métricas derivadas: `confirmedDealsCount`, `avgRating`, `disputeRate`, `responseTimeP50ms`, `recurringClientsCount`, agrupadas por categoria/ticket band/região. Recalculadas por job. Não é score único — é vetor de sinais para leitura humana.

### 2.12 `AuditEvent` (todas as fases)
Trilha polimórfica (`entityType` + `entityId`) usada por DealRoom, Company, Review, Evidence. Toda transição de estado relevante gera um evento.

## 3. Enums centrais

- `VerificationStatus`: `UNVERIFIED | EMAIL_VERIFIED | DOC_VERIFIED`
- `CompanyMemberRole`: `OWNER | COMMERCIAL | OPERATIONS | FINANCE | BUYER`
- `DealTemplate`: `ONE_OFF | RECURRING | PRODUCT_SUPPLY`
- `DealRoomStatus`: `OPENED | SCOPED | QUOTED | ACCEPTED | IN_PROGRESS | DELIVERED | CONFIRMED | CLOSED | DISPUTED | CANCELLED`
- `EvidenceKind`: `PHOTO | DOC | SIGNATURE | INVOICE_PREVIEW`
- `DeliveryCycleStatus`: `SCHEDULED | DELIVERED | CONFIRMED | CANCELLED`

Labels bilíngues: `lib/status/enums.ts`. Strings livres de status são proibidas.

## 4. Princípios

- Reputação só nasce de `DealRoom.status = CONFIRMED` com evidência aceita pela contraparte.
- Sem score único opaco — sempre decomposto em sinais.
- Reviews vinculados a deal real, não a perfil.
- Auditabilidade: toda mudança de estado em DealRoom/Company/Review gera `AuditEvent`.
- Visibilidade controlada: nem todo dado é público (PII criptografada via pgcrypto).
- Plataforma sinaliza evidência e comportamento; **não** afirma garantia de qualidade.

## 5. Fora de escopo do MVP

- Escrow / pagamento integrado.
- Cláusulas jurídicas parametrizadas.
- Score financeiro / análise de crédito.
- Mediação automática de disputa.
- ERP, fiscal, BL/Invoice oficiais.
- Trust graph (relacionamento entre empresas além do deal).
- Onboarding fora do wedge (serviços técnicos B2B locais).

Ver ADR 0003 para a tese do pivot e ADR 0004 (futuro) para a estratégia de mitigação de gaming reputacional.
