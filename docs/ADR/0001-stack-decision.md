# ADR-0001 — Stack Fundacional

**Status**: aceito
**Data**: 2026-04-20
**Contexto**: Fase 0, bootstrap

---

## Contexto

Estamos iniciando o Luma Global Trade Command, um produto de canvas geoespacial premium para agroexportação, com visão e escopo descritos em `docs/01` e `docs/12`. Precisamos selecionar a stack fundacional com três objetivos principais:

1. Velocidade de MVP (≤ 11 semanas conservador).
2. Qualidade visual premium (globo cinematográfico + mapa custom).
3. Extensibilidade para RegStack, ERP/WMS e produção com tráfego real.

## Decisão

Adotamos, para o MVP:

- **Next.js 15 (App Router) + TypeScript estrito + pnpm**.
- **React Three Fiber** para globo 3D; **Mapbox GL JS + Deck.gl** para o Origin Map.
- **Tailwind CSS 3 + shadcn/ui + Radix**.
- **Framer Motion** para animações UI.
- **Zustand** (estado de canvas / FSM) + **TanStack Query** (server state).
- **tRPC v11** sobre Next.js Route Handlers.
- **Prisma** + **PostgreSQL 16 via Docker Compose** em dev (`docker-compose.yml`).
- **Auth.js v5 (NextAuth)** com Nodemailer magic link; **Mailpit** como SMTP dev.
- **Filesystem local** para fotos em dev; signed URLs via HMAC; migração para S3/Supabase Storage em prod.
- **Vitest** (unit) + **Playwright** (e2e).
- **next-intl** (PT-BR + EN).
- **Vercel** (web prod) + **Postgres gerenciado** (Supabase/Neon/RDS — escolha adiada) em prod.

## Alternativas consideradas

| Alternativa | Motivo de recusa |
|---|---|
| **Vite + React SPA** | Exigiria montar backend separado; mais pontos de fricção para MVP |
| **Cesium para globo** | Estética "científica/militar" difícil de destravar; pesado |
| **MapLibre direto** | Qualidade de satellite imagery inferior; viável como fallback |
| **Google Maps JS** | Menos customizável esteticamente; mais caro em produção |
| **Supabase direto em dev** | Cria dependência externa; stakeholder preferiu dev 100% local |
| **SQLite local** | Schema diverge do Postgres de produção; retrabalho em migrations |
| **GraphQL / REST puro** | Overkill (GraphQL) ou falta de type-safety (REST) para o escopo |
| **Drizzle ORM** | Performance maior, mas DX inferior a Prisma no ecossistema Claude Code |
| **Supabase Auth de cara** | Dependência externa prematura; Auth.js mantém dev local |

## Consequências

### Positivas
- Ambiente de dev 100% local (Docker + pnpm), zero credenciais externas.
- Type-safety end-to-end (Prisma → tRPC → React Query).
- Caminho limpo de migração para produção (só `DATABASE_URL`, SMTP corporativo, bucket S3).
- Custo operacional zero durante o desenvolvimento.

### Negativas / trade-offs
- Docker Desktop é pré-requisito local — stakeholder precisa instalar.
- Mapbox tem custo em produção com tráfego real (monitorar, com MapLibre como plano B).
- R3F exige cuidado com performance; budget de 60fps precisa ser monitorado desde F1.
- Auth.js v5 ainda é beta em algumas integrações — fixar em versão conhecida.

### Reversibilidade
- Mapbox → MapLibre: trivial (APIs compatíveis).
- Postgres Docker → Postgres gerenciado: só muda `DATABASE_URL`.
- Auth.js → Supabase Auth: troca contida (1–2 dias).
- tRPC → adicionar adapter REST: aditivo, não removível.

Decisões verdadeiramente irreversíveis **não** estão nesta ADR.

## Referências

- Plano mestre: `C:\Users\Pichau\.claude\plans\voc-o-arquiteto-chefe-synchronous-koala.md` (Seção 7)
- `docs/12-technical-architecture.md`
- `docs/13-tech-stack-decisions.md`
