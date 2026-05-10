# ADR 0003 — Pivot to B2B trust network

- **Date:** 2026-05-10
- **Status:** Accepted
- **Supersedes:** ADR 0001 (stack decision permanece válida) e o Charter agroexport (`docs/00`).

## Contexto

O projeto nasceu como **Luma Global Trade Command**, torre de comando agroexportadora de frutas, com tese de resolver confiança no mercado de exportação. Após maturação da hipótese, o problema real foi reformulado: **o gap de confiança não é específico do agroexport — é estrutural no B2B em geral**.

Hoje, empresas tentam responder "em quem dá para confiar para fazer negócio?" combinando sinais fracos e fragmentados (site, Instagram, indicação informal, PDF, WhatsApp, contratos fora da plataforma). O resultado é ruído, atrito e risco bilateral.

## Decisão

Pivotar para **Rede de Confiança Transacional B2B** — infraestrutura onde empresas descobrem, validam, executam e comprovam negócios, e onde cada negócio bem conduzido fortalece a confiança do próximo.

**Wedge inicial:** serviços técnicos/operacionais B2B locais (climatização, refrigeração, elétrica, manutenção predial, segurança eletrônica, TI para PMEs).

**Métrica norteadora:** negócios concluídos com evidência e aceite confirmados na plataforma.

## O que muda

### Reaproveitado (~70% da stack)

- Auth.js v5 magic link.
- `AuditEvent` polimórfico.
- Repos por interface (padrão).
- RBAC + multi-tenant (`BuyerCompany` → `Company`).
- i18n bilíngue (`lib/status/enums.ts`).
- Rules engine declarativa (padrão).
- Email templates Nodemailer (adaptados).
- FSM Zustand canvas (padrão; conteúdo agro descartado).
- Mapa Mapbox + carrossel de mídia (a ser generalizado em F1 como `CompanyMap`).
- Compressão client-side de fotos (`browser-image-compression`).
- Design tokens Tailwind (paleta `luma-*` mantida sob nome de placeholder).
- Infra Docker (Postgres + Mailpit + Adminer), Next 15, tRPC v11, TanStack Query, Vitest+Playwright.

### Descartado

- Globo 3D (`components/canvas/GlobeCanvas.tsx`).
- Models agro: `Origin`, `FieldPlot`, `PhotoRoutine`, `PhytosanitaryRequirement`, `HarvestWindow`, `Availability`, `LogisticsHub`, `PackingHouse`, `ColdChamber`, `FieldOperator`, `PhotoSubmission`, `FieldUpdate`, `FieldPhoto`, `Origin*`, `Routine*`.
- Seeds Vale do São Francisco (`data/seed/*`).
- Mídia agro (`public/media/photos/*`, `public/media/videos/*`).
- Runbooks fitossanitários e go-live agro (`docs/runbooks/`, `docs/golive/`).
- Rotas agro: `app/admin/{origins,availability,harvest-windows,photos,requirements}`, `app/field/*`, `app/buyer/proposals` (deal room reescrito em F3).
- Componentes acoplados: `components/{admin,internal,field,buyer,panels,brand,canvas}` (todos conteúdo agro — frameworks rebuild em F1+).

### Refatorado / a reconstruir

- Schema Prisma (baseline `pivot_baseline` em F0; expansão por fase).
- `docs/06` (ontologia reescrita).
- `lib/canvas/store.ts` (FSM rebuilt para semântica B2B em F1).
- `server/*` totalmente reescrito (estava deletado pré-pivot; será reconstruído com routers Company/DealRoom/Review).

## Consequências

### Positivas

- Mercado endereçável muito maior (B2B genérico vs. agro fruta).
- Reaproveitamento alto: economiza ~4–6 semanas de re-implementação de auth, FSM, audit, repos, infra, design system.
- Infra pronta para PostGIS (geolocalização para discovery) e prisma-adapter já configurado.
- Time pode entrar em F1 (Company) imediatamente após F0.

### Negativas / riscos aceitos

- Schema reset perde dados. **Mitigação:** dados atuais são seeds narrativos pré-PMF, sem usuários reais.
- Branding "Luma" foi mantido em paleta Tailwind como placeholder; rebrand final adiado.
- Documentação agro (`docs/golive`, `docs/runbooks`, `docs/00`, `docs/01`) precisa ser revisada/reescrita em fases posteriores.

## Próximos passos

- F0 (atual): branch `pivot-b2b`, schema mínimo, baseline migration, ontologia reescrita, este ADR. Build verde.
- F1: `Company`, `CompanyMember`, `ServiceOffering`, `VerificationArtifact`, `CompanyMap`, onboarding, perfil público, admin verifications.
- F2 (paralelo a F3): discovery com PostGIS + filtros + ranking.
- F3: `DealRoom`, `DeliveryCycle`, `Evidence`, `DealRoomMessage`, FSM completa.
- F4: `Review` automático em transição CONFIRMED, view `CompanyReputation`, badge no perfil. Documentar em ADR 0004 a estratégia de mitigação de gaming reputacional.
