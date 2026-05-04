# Runbook — Restore (Neon PITR)

## Quando usar

- Migration destrutiva aplicada por engano.
- Bulk delete acidental (mesmo via Admin Console).
- Compromisso de credenciais ou suspeita de tampering.

## Pré-requisitos

- Plano Neon com **PITR ≥ 7 dias** (verificar no console Neon).
- Acesso de admin ao projeto Neon.
- Janela de manutenção combinada com Luma (ou aceitar downtime curto se for
  emergência).

## Procedimento

1. **Identificar o timestamp alvo** (segundos antes do incidente).
2. No console Neon, **branch da prod** apontando para esse timestamp:
   - Branches → New branch → Source: `main`, Type: `at point in time` →
     timestamp → nome `restore-YYYYMMDD-hhmm`.
3. Conectar via `psql` à branch nova, validar dados:
   ```sql
   SELECT count(*) FROM proposals WHERE created_at < 'YYYY-MM-DD';
   ```
4. **Promover** a branch para a `main` se a validação for OK:
   - Atualizar `DATABASE_URL` e `DIRECT_URL` no Vercel para apontar à branch
     restaurada.
   - Redeploy do Vercel (botão Redeploy → uso latest).
5. Confirmar que `/api/health` responde 200.
6. Comunicar a Luma (e-mail) com:
   - Janela impactada.
   - O que foi perdido vs restaurado (e.g. propostas criadas entre o backup e
     o restore).
   - Próximos passos para reverter perda residual (manualmente).

## Drill (executar 1× antes de go-live e anualmente)

1. Criar branch PITR a partir da `main` (~ 1h atrás).
2. Conectar com `psql`, rodar `SELECT count(*) FROM users` e validar > 0.
3. **Não promover** — descartar a branch.
4. Anotar tempo total no commit "drill: <data>".

Resultado esperado: < 15min do reconhecimento ao DB restaurado consultável.

## Não-faça

- ❌ Restore direto na branch `main` sem validar a branch nova primeiro.
- ❌ Restore sem comunicar Luma (mesmo se for "rápido demais para alertar").
