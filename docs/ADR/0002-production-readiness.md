# ADR 0002 — Production readiness para uso real (Luma single-tenant)

**Data:** 2026-05-04
**Status:** Em execução
**Plano correlato:** `~/.claude/plans/planeje-e-execute-tudo-humming-lemon.md`

## Contexto

O MVP (F0–F10) foi entregue. F11-A (buyer signup + field operators + photo
routines) foi committado em F11-B. Para colocar o produto em uso real com
clientes da Luma — single-tenant, sem abrir para outras fazendas — auditamos
três classes de gaps:

1. **Produto** — buyer não tinha visibilidade pós-submit (sem página de
   propostas, sem e-mails de transição, sem PDF, sem fluxo de "edit & resubmit").
2. **Engenharia** — auth sem rate-limit, sem headers de segurança, blob URLs
   públicas previsíveis, sem Sentry, sem logger estruturado, seed sem guarda
   contra prod, mailer com `shouldSkipSmtp` silencioso em prod.
3. **Legal/Ops** — sem Privacy/Terms/Cookie, sem domínio, sem Resend
   verificado, sem Neon prod, sem runbooks.

## Decisão

Executar 9 workstreams sequenciais (F11-B → F20) em ~7–8 semanas até go-live.
Decisões técnicas tomadas:

- **Single-tenant** — não abstrair para multi-tenant. Qualquer scaffolding
  para outras fazendas é YAGNI agora.
- **Rate-limit:** Upstash Redis (free tier). No-op quando env não setado, para
  não bloquear dev/CI. Limites: magic-link 5/10min/IP+email; signup 3/30min/IP;
  proposal submit 10/h/buyer.
- **CSP:** entra em Report-Only por 24h, depois enforcing via `CSP_ENFORCE=1`.
- **Sentry:** wrap via `withSentryConfig` no `next.config.mjs`. No-op sem DSN.
  Registra apenas `INTERNAL_SERVER_ERROR`/`PARSE_ERROR` — 4xx esperados não
  contam para evitar ruído.
- **Vercel Blob:** mantém `access:'public'` mas com `addRandomSuffix:true` para
  paths imprevisíveis. `getDisplayUrl()` é o ponto de migração para signed URLs
  quando passarmos para Blob privado (Pro).
- **PDF:** `@react-pdf/renderer` para resumo de proposta sem preço.
- **Mail:** `transport.ts` lança em prod sem SMTP. Erros de mail nunca
  derrubam transição de estado (try/catch + Sentry).
- **AuditEvent polimórfico:** FK movida para coluna `proposalId` separada;
  `entityId` permanece como id polimórfico sem FK. Permite auditar
  StaffMember, BuyerCompany, FieldPhoto, etc.
- **`buyerProcedure`:** procedure tRPC nova que exige role=BUYER + APPROVED +
  onboarding completo. Resolve company para `ctx.buyer`.
- **i18n:** páginas de buyer usam strings bilíngues inline (PT/EN) por
  pragmatismo, espelhando o padrão admin/field. Migrar para `messages/*.json`
  fica para um sweep posterior.
- **Negociação e geração de Invoice/BL:** explicitamente fora do escopo,
  conforme guard-rails da CLAUDE.md.

## Consequências

- O produto suporta single-tenant Luma com qualidade de produção.
- Multi-tenant exigirá ADR novo + refactor (BuyerCompany → tenantId em tudo).
- A migração para Vercel Blob privado é feita trocando uma função
  (`getDisplayUrl`), sem mudar consumidores.
- O LGPD precisa de revisão jurídica antes do go-live; placeholder técnico
  está pronto.

## Workstreams (status)

| Fase | Conteúdo | Status |
|---|---|---|
| F11-B | AuditEvent polimórfico, transport endurecido, commit do F11-A | ✅ |
| F12 | Buyer feedback loop (páginas, emails, PDF, resubmit) | ✅ |
| F13 | Rate-limit, CSP/HSTS, Sentry, signed URL helper | ✅ |
| F14 | Privacy/Terms/Cookies + cookie banner | placeholder |
| F15 | /api/health, seed guard, admin signals | ✅ |
| F16 | Photo pipeline V2 (compress + variants) | pendente |
| F17 | Manual buyer create, resend invite | pendente |
| F18 | Neon prod, Resend, domínio, Vercel Pro | depende de Luma |
| F19 | Runbooks, branch protection, CI extension | em execução |
| F20 | Curadoria de dados reais Luma | depende de Luma |

## Go-live gate

Ver `docs/golive/checklist.md`.
