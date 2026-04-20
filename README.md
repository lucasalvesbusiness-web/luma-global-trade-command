# Luma Global Trade Command

**Single Operational Canvas for Agroexport Buyers.** Parceria Luma × Spectre.

> Torre de comando agroexportadora. Do globo terrestre à origem no Vale do São Francisco, passando por produto, container, compliance e proposta — tudo em um único canvas contínuo.

---

## Documentação

O plano mestre e os documentos canônicos ficam em `docs/`. Comece por:

- `docs/00-project-charter.md` — escopo e governança.
- `docs/01-product-vision-and-strategic-thesis.md` — visão de produto.
- `docs/06-operational-ontology-and-object-model.md` — ontologia de domínio (canon).
- `docs/12-technical-architecture.md` — arquitetura.
- `docs/13-tech-stack-decisions.md` — stack e justificativas.
- `docs/ADR/` — decisões arquiteturais datadas.

Regras operacionais para automação (incluindo Claude Code): `CLAUDE.md`.

---

## Requisitos

- Node.js ≥ 20
- pnpm 9 (`corepack enable` + `corepack prepare pnpm@9.15.0 --activate` ou `npm i -g pnpm@9`)
- Docker Desktop (para Postgres + Mailpit + Adminer em dev)
- Conta Mapbox (free tier) — gerar `NEXT_PUBLIC_MAPBOX_TOKEN`

---

## Setup (Fase 0)

```bash
# 1. Copie o arquivo de ambiente
cp .env.example .env
# Edite .env: gere AUTH_SECRET (openssl rand -base64 32) e cole seu NEXT_PUBLIC_MAPBOX_TOKEN

# 2. Suba o Postgres, Mailpit e Adminer
pnpm db:up

# 3. Instale dependências
pnpm install

# 4. Rode migrations
pnpm prisma:migrate

# 5. (Futuro, quando seed estiver pronto — Fase 2)
# pnpm prisma:seed

# 6. Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse:
- **App**: http://localhost:3000
- **Adminer** (UI Postgres): http://localhost:8080 (servidor: `postgres`, user: `luma`, db: `luma_gtc`)
- **Mailpit** (inbox SMTP dev): http://localhost:8025

---

## Scripts principais

```bash
pnpm dev             # Next.js dev (Turbopack)
pnpm build           # Build produção
pnpm lint            # ESLint
pnpm typecheck       # tsc --noEmit
pnpm test            # Vitest (unit)
pnpm test:e2e        # Playwright (E2E; sobe pnpm dev automaticamente)
pnpm format          # Prettier --write

pnpm db:up           # Sobe Postgres + Mailpit + Adminer
pnpm db:down         # Para containers
pnpm db:reset        # Recria volumes e sobe limpo
pnpm db:logs         # Tail dos logs do Postgres

pnpm prisma:generate # Gera client Prisma
pnpm prisma:migrate  # Aplica migrations em dev
pnpm prisma:studio   # Abre Prisma Studio
pnpm prisma:seed     # (Fase 2+) Popula banco com dados narrativos
```

---

## Estrutura (overview)

```
app/            # Next.js App Router (rotas (buyer) | (internal) | (admin))
components/     # UI: canvas, panels, proposal, brand, ui
lib/            # Ontology, rules, i18n, utils, canvas store
server/         # tRPC, services, repositories, auth
prisma/         # schema.prisma + migrations + docker-init SQL
data/seed/      # (Fase 2) seed narrativo
docs/           # Documentos canônicos + ADRs
messages/       # i18n (pt-br, en)
public/         # imagery/, 3d/, ícones
styles/         # tokens.css (paleta Luma)
tests/          # unit (Vitest) + e2e (Playwright)
```

---

## Stack

Next.js 15 · React 19 · TypeScript estrito · Tailwind · shadcn/ui · Framer Motion · React Three Fiber · Mapbox GL JS · Zustand · TanStack Query · tRPC v11 · Prisma · Postgres 16 · Auth.js v5 · Vitest · Playwright.

Detalhes e justificativas em `docs/13-tech-stack-decisions.md`.

---

## Licença

Proprietário — Luma × Spectre. Uso interno; não redistribuir sem autorização.
