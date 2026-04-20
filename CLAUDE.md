# CLAUDE.md — Regras do projeto

Este arquivo é a **entrada operacional** para qualquer instância do Claude (Code, Agent SDK ou API) trabalhando neste repositório. Lido junto com todo prompt.

---

## 1. O que este projeto é

**Luma Global Trade Command** — Single Operational Canvas for Agroexport Buyers.
Parceria Luma × Spectre. Não é site, não é marketplace, não é dashboard SaaS. É uma torre de comando agroexportadora com ontologia operacional rigorosa e estética natural premium.

Plano mestre: `C:\Users\Pichau\.claude\plans\voc-o-arquiteto-chefe-synchronous-koala.md`.

## 2. Documentos canônicos (ler antes de decidir)

- `docs/00-project-charter.md` — escopo, stakeholders, metas.
- `docs/01-product-vision-and-strategic-thesis.md` — visão e princípios.
- `docs/06-operational-ontology-and-object-model.md` — **contrato de domínio**.
- `docs/12-technical-architecture.md` — camadas e boundaries.
- `docs/13-tech-stack-decisions.md` — stack e justificativas.
- `docs/ADR/*.md` — decisões arquiteturais datadas.

**Se você for tomar uma decisão arquitetural que contradiz um desses documentos, pare e proponha uma ADR.**

## 3. Stack resumida

- Next.js 15 (App Router) + TypeScript estrito + pnpm 9.
- React Three Fiber (globo) · Mapbox GL JS (Origin Map) · Framer Motion.
- Tailwind + shadcn/ui + Radix.
- Zustand (canvas FSM) + TanStack Query + tRPC v11.
- Prisma + Postgres 16 (Docker) em dev; Auth.js v5 com Nodemailer + Mailpit.
- Vitest + Playwright.

## 4. Guard-rails não-negociáveis

Replicados da Seção 17 do plano mestre:

- ❌ **Não** usar dark theme como padrão nem como opção principal.
- ❌ **Não** mostrar preço público no canvas.
- ❌ **Não** permitir "Buy now"/"Order now" — apenas "Submit proposal" e variantes.
- ❌ **Não** expor fazenda/parceiro identificável sem controle explícito.
- ❌ **Não** exibir estoque numérico exato na camada pública (use `volumeTonsBand`).
- ❌ **Não** prometer datas de entrega — apenas janelas estimadas com `ConfidenceLevel`.
- ❌ **Não** usar templates de dashboard genéricos sem recustomização profunda.
- ❌ **Não** ligar integração real com ERP/WMS no MVP.
- ❌ **Não** acoplar regras de negócio a componentes — tudo passa pela Rules Engine em `lib/rules/`.
- ❌ **Não** versionar `.env`, fotos reais dos parceiros, ou credenciais.
- ❌ **Não** usar ícones coloridos, neon, ou glyphs gamificados. Só Lucide com stroke fino.
- ❌ **Não** gerar documentos oficiais (Invoice, BL, etc.) no MVP — apenas *preview list*.
- ❌ **Não** usar strings livres para status. Enums tipados (Prisma) sempre.
- ❌ **Não** encher a tela de métricas sem âncora operacional.

## 5. Padrões de código

- **Idioma dos docs**: PT-BR.
- **Idioma de código, comentários e commits**: inglês, exceto strings de UI (bilíngue via next-intl).
- **Arquivos**: paths absolutos, TypeScript estrito, ESM (`.mjs` para config).
- **Server-first**: use Server Components por padrão; `'use client'` só quando necessário.
- **Repositórios por interface** em `server/repositories/`. Serviços **não** importam Prisma diretamente.
- **Regras de negócio** em `lib/rules/` como TS puro testável.
- **Status bilíngue** em `lib/status/enums.ts`; nunca hardcode strings de status em componentes.

## 6. Ontologia é lei

O domínio vive em `docs/06` e é refletido 1:1 em `prisma/schema.prisma`. Ao criar um novo objeto, regra ou enum:

1. Atualize `docs/06` primeiro.
2. Crie migração Prisma.
3. Atualize `lib/ontology/` e `lib/status/enums.ts`.
4. Adicione ADR se a decisão for significativa.

## 7. Comandos comuns

```bash
pnpm db:up           # sobe Postgres + Mailpit + Adminer via Docker
pnpm db:reset        # recria volumes e sobe limpo
pnpm prisma:migrate  # aplica migrations em dev
pnpm prisma:seed     # popula com dados narrativos (data/seed/)
pnpm dev             # Next.js dev (Turbopack)
pnpm lint            # ESLint
pnpm typecheck       # tsc --noEmit
pnpm test            # Vitest
pnpm test:e2e        # Playwright (inicia pnpm dev automaticamente)
pnpm build           # Build produção
```

## 8. Onde colocar o quê

| Você quer adicionar… | Coloque em… |
|---|---|
| Nova rota pública (canvas) | `app/(buyer)/` |
| Nova rota staff | `app/(internal)/` |
| Nova rota admin | `app/(admin)/` |
| Novo componente de canvas | `components/canvas/` |
| Novo painel flutuante | `components/panels/` |
| Primitivo de UI | `components/ui/` |
| Nova regra de negócio | `lib/rules/` |
| Novo tipo de domínio | `lib/ontology/` (alinhado com `docs/06`) |
| Novo repositório | `server/repositories/` (interface + impl) |
| Novo serviço de aplicação | `server/services/` |
| Novo router tRPC | `server/trpc/routers/` |
| Nova migração Prisma | `prisma/migrations/` (via CLI) |
| Novo seed narrativo | `data/seed/` |
| Foto curada | `public/imagery/` (NÃO committar fotos reais do parceiro) |

## 9. Fora do escopo do MVP

Ver `docs/00` §3. Se for pedido algo fora, proponha ADR antes de implementar.

## 10. Segurança

- PII criptografada (pgcrypto).
- Fotos com signed URL HMAC, TTL ≤ 1h.
- Sem secrets em código; `.env.example` é o contrato.
- CI roda lint/typecheck/test/build obrigatórios.
