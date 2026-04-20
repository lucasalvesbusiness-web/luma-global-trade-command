# 12 · Arquitetura Técnica

**Estado**: canon · Fase 0
**Última atualização**: 2026-04-20

---

## 1. Visão de alto nível

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js 15 (App Router)                │
│   RSC + Route Handlers + tRPC v11 + Edge where safe     │
├────────────────┬────────────────────────────────────────┤
│  Canvas layer  │  Internal / Admin layer                │
│  R3F + Mapbox  │  shadcn/ui + TanStack Table + RHF      │
│  Zustand FSM   │  TanStack Query                        │
├────────────────┴────────────────────────────────────────┤
│          Application services (server-only)             │
│  Ontology  │  Rules Engine  │  Proposal workflow        │
├─────────────────────────────────────────────────────────┤
│  Repositories (interface) → Prisma impl (MVP)           │
│                            → ERP/WMS impl (futuro)      │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL 16 (Docker local)  │ FS storage │ Auth.js  │
└─────────────────────────────────────────────────────────┘
```

## 2. Rotas e segmentação

A aplicação está segmentada em três **route groups** do App Router:

- **`app/(buyer)/`** — canvas público. RSC por padrão, componentes `'use client'` apenas onde há canvas/interação.
- **`app/(internal)/`** — área do staff Luma (commercial/operations/compliance). Protegida por middleware + role.
- **`app/(admin)/`** — CRUD da Luma/Spectre. Protegida por `role=ADMIN`.

Rotas de API:

- **`app/api/auth/[...nextauth]/`** — Auth.js v5.
- **`app/api/trpc/[trpc]/`** — endpoint tRPC único.

## 3. Princípios de código

1. **Repositórios por interface**. Serviços dependem de `ProductRepository`, `AvailabilityRepository`, `ProposalRepository` — não do Prisma direto. Isso permite trocar para ERP/WMS no futuro sem tocar na UI.
2. **Rules Engine declarativa**. Regras (produto×país, container×temperatura, frozen×fresh) moram em arquivos TS tipados em `lib/rules/`. Nunca em componentes.
3. **Server Components por padrão**. Client-side só quando necessário (canvas, formulários interativos, estado local rico).
4. **Auditoria universal**. Toda transição sensível emite `AuditEvent` com ator, timestamp, from/to, diff.
5. **Enums tipados sempre**. Nunca strings livres para status.
6. **Type-safety end-to-end**. Prisma → Zod contracts → tRPC → React Query → componentes.

## 4. Camadas lógicas

### 4.1 UI (client)
- `components/canvas/` — Globe (R3F), OriginMap (Mapbox GL JS), ContainerScene (R3F + GLB).
- `components/panels/` — ProductPassport, FieldView, CompliancePreview.
- `components/proposal/` — ProposalDrawer, ProposalSummary.
- `components/ui/` — primitivos shadcn/ui.

### 4.2 Estado
- **Zustand** (`lib/canvas/store.ts`) — FSM do canvas: `intro → destinationSelection → destinationConfirmed → transitToBrazil → originReveal → productExploration → containerBuilding → proposalReview → proposalSubmitted`.
- **TanStack Query via tRPC** — cache de dados remotos.
- **RSC props** — dados estáticos/semi-estáticos via Server Components.

### 4.3 Server
- `server/trpc/routers/` — endpoints tipados; agrupados por domínio.
- `server/services/` — lógica de aplicação (ProposalService, AvailabilityService, ComplianceService).
- `server/repositories/` — interfaces + impls Prisma.
- `server/auth/` — Auth.js v5 config e helpers.

### 4.4 Domínio
- `lib/ontology/` — tipos de domínio (espelhando `docs/06`).
- `lib/rules/` — engine declarativa.
- `lib/status/` — labels bilíngues dos enums operacionais.

## 5. Persistência

- **Desenvolvimento**: Postgres 16 via Docker Compose (`docker-compose.yml`). Schema + migrations em `prisma/`.
- **Produção**: Postgres gerenciado (Supabase, Neon ou RDS — decisão adiada). Mesmo schema, mesmas migrations.
- **Extensões PG**: `pgcrypto`, `citext`, `uuid-ossp` (habilitadas via `prisma/docker-init/01-extensions.sql`).

## 6. Auth e RBAC

- **Auth.js v5 (NextAuth)** com provider Nodemailer (magic link).
- **Dev**: SMTP via Mailpit (`localhost:1025`; UI em `:8025`).
- **Prod**: SMTP corporativo (Resend, Postmark, SES — TBD).
- **Sessão**: `strategy: 'database'` → Sessions na tabela Prisma.
- **RBAC**: `User.role` ∈ {BUYER, STAFF, ADMIN} + `StaffMember.team` para permissões intra-staff. Checagem em tRPC middlewares (`protectedProcedure`, `staffProcedure`, `adminProcedure`).

## 7. Storage de imagens

- **MVP/dev**: filesystem local (`public/imagery/field/`), servidas via rota Next.js que valida sessão e `approvedForBuyerView`.
- **Produção**: migrar para S3/Supabase Storage. Interface `PhotoStorage` já planeja isso — a UI não muda.

## 8. Observabilidade

- **MVP**: logs estruturados (`lib/log`), Sentry opcional em F10.
- **Pós-MVP**: OpenTelemetry, dashboards de latência e erro.

## 9. Build e deploy

- **Dev**: `pnpm dev` (Turbopack).
- **CI**: GitHub Actions — lint + typecheck + test + build contra Postgres service container.
- **Prod (futuro)**: Vercel (web) + Postgres gerenciado.

## 10. Segurança

- Cookies `SameSite=Lax`, `Secure` em prod.
- CSRF mitigado por same-site e Auth.js.
- PII criptografada em repouso (pgcrypto).
- Signed URLs (HMAC) para fotos, expirando em ≤ 1h.
- RLS ativada em produção (após migrar para Postgres gerenciado com suporte).
- Sem preços públicos, sem estoque exato, sem identidade de parceiro sem controle — guard-rail aplicado em views públicas + schema.

## 11. Limites explícitos do MVP

- Sem integração ERP/WMS.
- Sem RegStack completo (apenas preview).
- Sem pagamentos.
- Sem mobile nativo.
- Sem otimização 3D de packing real — aproximação volumétrica basta.

Referência completa: `docs/../plans/voc-o-arquiteto-chefe-synchronous-koala.md` (plano mestre).
