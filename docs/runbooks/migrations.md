# Runbook — Migrations (Prisma + Neon)

## Princípios

1. **Expand-contract.** Migrations são aditivas primeiro. Em release N: adiciona
   coluna nova nullable. Em release N+1: aplicação passa a escrever na coluna
   nova. Em release N+2: aplicação para de ler a antiga. Em release N+3: drop
   da coluna antiga. Nunca colapsar.
2. **Migrate em build.** O script `pnpm build:with-migrate` roda
   `prisma migrate deploy && next build`. No Vercel, configurar o build command
   para isso quando houver migration nova.
3. **`DIRECT_URL` é obrigatório em prod.** Vercel + Neon usam pooler para o
   runtime (`DATABASE_URL`), mas `prisma migrate deploy` exige conexão direta.

## Antes de mergear migration nova

- [ ] Migration roda limpa em **branch preview do Neon**:
  ```bash
  DATABASE_URL=<preview-pooler> DIRECT_URL=<preview-direct> \
    pnpm prisma migrate deploy
  ```
- [ ] Foi verificada com `pnpm prisma migrate diff --from-empty --to-migrations`
  (sem drift inesperado).
- [ ] PR tem checkbox marcado dizendo expand/contract phase.
- [ ] Se a migration adiciona NOT NULL com default, o default cobre o backfill
  ou existe um seed de bootstrap.

## Aplicar em produção

1. Abrir PR contra `main` com a migration.
2. CI verde (lint/typecheck/test/e2e/lighthouse).
3. Merge. Vercel dispara build → roda `prisma migrate deploy` antes do `next build`.
4. Acompanhar `/api/health` por ~5min.
5. Se Sentry receber pico de erro de schema, **rollback** (próxima seção).

## Rollback

Migrations não dão rollback automático. Cenários:

- **Aditiva (coluna nova nullable, índice novo)** — basta reverter o código
  que usava. A coluna fica órfã até a próxima migration de cleanup. Sem
  downtime.
- **Destrutiva acidental** — recorrer a Neon PITR (point-in-time recovery).
  Ver `restore.md`.
- **Migração de dados em flight** — pause writes na rota afetada via feature
  flag (`FEATURE_*`), corrija o estado via SQL pontual, retome.

## Convenção de nome

`YYYYMMDDHHMMSS_short_snake_summary` — ex: `20260429220000_proposal_note_from_buyer`.
A timestamp prefix é o ID; o resumo é só para humanos no review.

## Não-faça

- ❌ Editar uma migration já aplicada em prod. Crie uma nova.
- ❌ `prisma db push` em prod. Sempre `migrate deploy`.
- ❌ Rodar `pnpm prisma:seed` em prod. O guard em `data/seed/seed.ts` exige
  `SEED_ALLOWED=1` explícito.
