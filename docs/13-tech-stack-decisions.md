# 13 · Decisões de Stack Técnica

**Estado**: canon · Fase 0
**Última atualização**: 2026-04-20
**Formato**: resumo executivo (decisões detalhadas vivem em `docs/ADR/`)

---

## Resumo

| Camada | Escolha | Alternativa descartada | Justificativa em uma linha |
|---|---|---|---|
| Framework web | **Next.js 15 (App Router) + TypeScript estrito** | Vite + React | App Router traz RSC, i18n, route handlers e streaming em um pacote único |
| Globo 3D | **React Three Fiber + drei + three.js** | Cesium, Mapbox Globe | Controle cinematográfico total com React declarativo |
| Mapa geoespacial | **Mapbox GL JS + Deck.gl** | MapLibre, Google Maps | Satellite imagery premium e Studio para estilo custom "Luma Natural" |
| Animações UI | **Framer Motion** | GSAP | Integração ótima com React; suficiente para UI |
| UI components | **shadcn/ui + Radix + Tailwind** | MUI, Chakra | shadcn é receita customizável — sem travas de tema |
| Tables / forms | **TanStack Table + React Hook Form + Zod** | ag-Grid, Formik | Type-safe, leve, moderna |
| Estado | **Zustand (canvas FSM) + TanStack Query** | Redux Toolkit | Zustand é minimalista e ideal para máquina de estados |
| API interna | **tRPC v11** sobre Route Handlers | REST puro, GraphQL | Type-safety end-to-end sem codegen |
| ORM | **Prisma** | Drizzle | DX superior com Claude Code; schema-first |
| Banco (MVP/dev) | **Postgres 16 via Docker Compose** | SQLite, Supabase direto | Zero dependência externa em dev; schema já compatível com gerenciado em prod |
| Banco (produção) | **Postgres gerenciado** (Supabase/Neon/RDS) — decisão adiada | — | Código de aplicação agnóstico; só muda `DATABASE_URL` |
| Auth (MVP) | **Auth.js v5 + Nodemailer magic link (Mailpit)** | Supabase Auth, Clerk | Mantém dev local; troca para provider gerenciado em prod é contida |
| Storage (MVP) | **Filesystem local + signed URLs (HMAC)** | Supabase Storage | Evita dep externa; interface pronta para S3/Supabase em prod |
| Deploy (MVP) | **Vercel (web) + Postgres gerenciado** (prod) | Railway, Fly.io | Vercel é onde Next.js rende mais |
| i18n | **next-intl** | react-i18next | Nativo do App Router com RSC |
| Testes | **Vitest + Playwright** | Jest + Cypress | Mais rápidos; stack de ponta |
| Seed/mocks | **TS scripts + JSON curados** | Prisma seed default | Seed precisa ser narrativo, não aleatório |
| Monorepo | **não** (MVP) | pnpm workspaces + Turborepo | Só extrai quando houver 2º app |

## Justificativas detalhadas (por que, não o que)

### Next.js 15 + App Router
O App Router entrega RSC, i18n, streaming e route handlers num pacote único — para um produto que mistura páginas institucionais rápidas (RSC) com canvas pesado client-side, é a solução mais coerente. Vite seria mais simples, mas exigiria montar o backend separadamente, fragmentando o tempo de MVP.

### TypeScript estrito (`strict` + `noUncheckedIndexedAccess`)
Ontologia pesada com 25+ entidades exige tipos fortes. Claude Code produz código significativamente mais consistente com TS estrito. Custo: leve fricção inicial; benefício: semanas de refactor evitadas.

### React Three Fiber para o globo
O globo não é um mapa — é uma peça cinematográfica. Cesium traz satellite imagery fantástica mas uma estética "científica/militar" impossível de destravar. Mapbox Globe é útil, mas não permite o nível de customização visual que a Luma exige. R3F entrega controle total da câmera, atmosfera e materiais mantendo React declarativo.

### Mapbox GL JS para o Origin Map
Decisão confirmada com stakeholder. Satellite imagery (Maxar) de altíssima qualidade, terreno 3D, Mapbox Studio para estilo "Luma Natural" (verdes oliva, azul-rio, areia). Free tier cobre MVP e demos (50k map loads/mês). Custo só aparece com tráfego produtivo real. MapLibre fica como backup OSS caso o custo escale.

### tRPC v11 (não GraphQL nem REST puro)
Type-safety end-to-end sem codegen é o maior ganho de velocidade para o MVP. Quando for preciso expor API para terceiros (V3), adicionamos um adapter REST. GraphQL seria overkill para o escopo atual.

### Prisma + Postgres 16 Docker
Prisma tem DX superior com Claude Code — migrations, Studio, schema-first. Postgres via Docker em dev mantém zero dependência externa. O schema + migrations já estão prontos para serem apontados a um Postgres gerenciado em produção. Decisão entre Supabase, Neon ou RDS é adiada para a fase pré-prod, quando conheceremos melhor o perfil de tráfego e necessidades de auth/storage.

### Auth.js v5 (NextAuth) com Nodemailer
Manter autenticação local no MVP (Mailpit capturando os e-mails de magic link) evita mais um serviço externo. Migrar para Supabase Auth ou Clerk em produção é uma troca relativamente contida, sem refatorar UI.

### Zustand + TanStack Query
Zustand é o melhor candidato para a **máquina de estados do canvas** — pequeno, sem boilerplate, com integração simples a React. TanStack Query cuida de cache e revalidação de dados remotos. Redux Toolkit resolveria, mas com custo de complexidade que o MVP não justifica.

### shadcn/ui + Radix + Tailwind
shadcn não é biblioteca — é uma receita copiável. Customizamos ao branding Luma sem brigar com tema de uma lib fechada (MUI, Chakra). Radix garante acessibilidade dos primitivos.

### Vitest + Playwright
Vitest é a evolução natural do Jest no ecossistema moderno; mais rápido e com melhor DX. Playwright virou padrão para E2E por estabilidade e suporte a multi-browser.

---

## ADRs individuais

Cada decisão reversível tem sua ADR em `docs/ADR/`. Lista inicial:

- `ADR-0001` — Stack fundacional (Next.js + Postgres Docker + Mapbox).
- (Próximas ADRs criadas conforme decisões significativas surjam.)
