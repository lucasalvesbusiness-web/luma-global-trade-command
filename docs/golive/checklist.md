# Go-live checklist — Luma GTC primeiro buyer real

Tudo deve estar TRUE antes de apontar a primeira URL pública para um buyer
da Luma. Marque com `[x]` quando concluído.

## Produto (F11-B + F12)

- [x] F11-A merged em `main`; CI verde.
- [x] AuditEvent polimórfico aceitando entidades não-Proposal.
- [x] `transport.ts` lança em prod sem SMTP (não silencia mais).
- [x] Buyer faz: signup → aprovação → submeter proposta → ver status mudar →
  ler notas TO_BUYER → resubmit em ADJUSTMENT_REQUESTED → baixar PDF.
- [ ] Buyer recebe e-mail no submit + cada uma das 5 transições visíveis
  (verificado manualmente em staging).

## Segurança (F13)

- [x] Rate-limit Upstash: magic-link 5/10min, signup 3/30min, submit 10/h.
  Code path no-op sem env (dev/CI). Em staging, a env precisa estar setada.
- [x] CSP em Report-Only (default). Após 24h em staging sem violações
  inesperadas, flipar `CSP_ENFORCE=1`.
- [x] HSTS preload, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy.
- [x] Vercel Blob com `addRandomSuffix:true` (paths imprevisíveis).
- [x] Sentry wired; no-op sem DSN. Em staging, DSN setada → exception teste
  capturada.
- [ ] `securityheaders.com` em `gtc.luma.com.br` retorna nota ≥ A (após
  enforcing).

## LGPD (F14)

- [x] `/legal/privacy`, `/legal/terms`, `/legal/cookies` no ar (placeholder
  técnico; counsel da Luma precisa revisar antes do go-live).
- [x] Cookie banner two-tier (essential / accept-all) montado em `app/layout.tsx`.
- [x] Signup tem checkbox obrigatório linkando para `/legal/terms` e
  `/legal/privacy`. Persiste `acceptedTermsAt` em `BuyerCompany`.
- [ ] Sentry session replay efetivamente gateado por consent (validar em
  staging).
- [ ] Texto final aprovado pelo counsel da Luma.

## Observabilidade (F15)

- [x] `/api/health` raw GET retorna 200 com `{ db, commit, env }`.
- [x] Middleware exempta `/api/health` e `/api/cron/*` do staging Basic Auth.
- [x] Seed lança erro sob `NODE_ENV=production` sem `SEED_ALLOWED=1`.
- [x] Admin dashboard mostra: produtos, origens, propostas, fotos pendentes,
  buyers aguardando aprovação, rotinas atrasadas.
- [ ] Better Uptime / UptimeRobot configurado com check 1min em
  `https://gtc.luma.com.br/api/health`.
- [ ] Sentry → Slack/email alertas configurados (5xx, cron fail, mail bounce).

## Foto pipeline (F16)

- [x] Compressão client-side via `browser-image-compression` (≤1.5 MB, 2048px,
  webworker). Aplicada no `FieldPlotSubmitClient`.
- [ ] **Deferido pós-launch:** variantes `thumb`/`med`/`full` via `sharp`.
  Mitigação: client compression já reduz banda significativamente; original
  serve admin e canvas até o pipeline V3.
- [ ] **Deferido pós-launch:** bulk upload `/admin/photos/bulk`. Mitigação:
  upload um a um aceitável até primeira cohort.

## Operacional (F17)

- [x] `/admin/buyers/new` para criação manual (sem signup público).
- [x] Botão "Reenviar magic link" em `AdminBuyerDetailClient`.
- [ ] Botão "Reenviar invite" em `AdminStaffClient` (deferido — staff invite
  já reenvia automaticamente quando re-chamado com mesmo email).

## Infra (F18 — Luma owns)

- [ ] Neon Postgres em `sa-east-1` com PITR ≥ 7 dias.
- [ ] Resend domain `luma.com.br` verificado (SPF + DKIM + DMARC).
- [ ] Domínio `gtc.luma.com.br` apontado para Vercel.
- [ ] Vercel Pro project com env vars triplicadas (Production / Preview / Dev).
- [ ] Backup drill executado (ver `runbooks/restore.md`) e documentado.

## Release engineering (F19)

- [x] Runbooks: migrations, restore, incident-response, secrets-rotation,
  add-buyer-manually.
- [x] ADR 0002 production-readiness.
- [ ] Branch protection em `main`: PR obrigatório, required checks (lint,
  typecheck, test, e2e-smoke, lighthouse), linear history, signed commits.
- [ ] CI estendida: `pnpm lint && tsc && vitest run && playwright test --grep @smoke && lhci autorun`.

## Dados reais (F20 — Luma owns)

- [ ] ≥ 10 produtos reais cadastrados via Admin Console.
- [ ] Fotos curadas das fazendas com sign-off Luma.
- [ ] Compliance text revisado por Luma para 6 países × 7 produtos.
- [ ] Privacy Policy + Terms aprovados pelo counsel.
- [ ] Inbox `LUMA_INTERNAL_INBOX` real definida.
- [ ] Lista de ≤5 buyers piloto definida.

## Acesso (gate final)

- [ ] ≥ 1 conta staff Luma + ≥ 1 buyer piloto provisionados via
  `/admin/buyers/new` (ou SQL interim).
- [ ] Smoke test ponta-a-ponta executado pelo staff Luma em staging.
- [ ] Sign-off final de Luma e Spectre por escrito.

## Pós-go-live (primeiras 2 semanas)

- [ ] Monitoramento intensivo: olhar Sentry + uptime 2x/dia.
- [ ] Coletar feedback dos primeiros 3 buyers.
- [ ] Fix-list priorizado para sprint de polish.
