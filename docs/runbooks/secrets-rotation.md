# Runbook — Rotação de secrets

## Cadência

Trimestral (cada 90 dias) ou imediatamente após:

- Saída de pessoa com acesso.
- Suspeita de vazamento (commit acidental, leak em log, screenshot público).
- Compromisso de máquina dev.

## Inventário

| Secret | Onde mora | Como gerar | Onde rotacionar |
|---|---|---|---|
| `AUTH_SECRET` | Vercel env (Production/Preview) | `openssl rand -base64 32` | Vercel → Settings → Env. Após save, redeploy. |
| `RESEND_API_KEY` (`SMTP_PASSWORD`) | Vercel env | resend.com → API Keys → Revoke + Create | Atualizar no Vercel → redeploy. |
| `BLOB_READ_WRITE_TOKEN` | Vercel env (auto) | Auto-rotacionado pelo Vercel | Sem ação manual normalmente. |
| `CRON_SECRET` | Vercel env | `openssl rand -hex 32` | Atualizar no Vercel → redeploy. |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel env | console.upstash.com → DB → Reset token | Atualizar Vercel → redeploy. |
| `SENTRY_AUTH_TOKEN` | Vercel env (build only) | sentry.io → Settings → Auth Tokens | Atualizar Vercel. |
| `DATABASE_URL` / `DIRECT_URL` | Vercel env | Neon → Branches → Roles → Reset password | Atualizar Vercel → redeploy. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Vercel env (público) | account.mapbox.com → Tokens. **Restringir por domínio.** | Atualizar Vercel → redeploy. |
| `SITE_PASSWORD` | Vercel env (Preview) | Senha forte aleatória | Atualizar e comunicar quem usa. |

## Procedimento

1. Notificar canal interno: "rotacionando {secret} agora".
2. Gerar novo valor.
3. Para credenciais com janela de overlap (DB password, Resend API):
   - Se possível, criar novo + manter o antigo válido por 1h.
   - Atualizar Vercel com o novo + redeploy.
   - Validar que app funciona com o novo.
   - Revogar o antigo.
4. Para credenciais sem overlap (AUTH_SECRET):
   - Aceitar que sessões existentes serão invalidadas no redeploy.
   - Comunicar com 24h de antecedência: "rotação de auth secret amanhã às
     HH:MM, todos precisarão logar novamente".
5. Atualizar `docs/runbooks/secrets-rotation.md` com a data da rotação.

## Histórico

- (registrar aqui cada rotação executada — data, secret, motivo, executor)

## Nunca

- ❌ Commitar secret em qualquer arquivo do repo.
- ❌ Compartilhar secret por canal não-criptografado (Slack DM puro, e-mail
  sem PGP, screenshot).
- ❌ Reutilizar valor de secret antigo "para não invalidar sessão".
