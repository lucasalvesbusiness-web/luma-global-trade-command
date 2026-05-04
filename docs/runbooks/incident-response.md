# Runbook — Incident response

## Severidades

| Sev | Definição | Resposta |
|---|---|---|
| **Sev1** | Plataforma offline; buyers não conseguem logar; DB indisponível. | Acionar imediatamente. Comunicar Luma em < 30min. |
| **Sev2** | Funcionalidade core quebrada (submit de proposta falhando, e-mails não saindo, fotos não carregando). | Acionar em horário comercial BR. |
| **Sev3** | Bug visível mas com workaround. | Issue + próxima sprint. |

## Detecção

- **Sentry** — alertas Slack/e-mail para `INTERNAL_SERVER_ERROR` > X/min.
- **Better Uptime / UptimeRobot** — ping em `/api/health` a cada 1min. Alerta
  se 503 ou timeout.
- **Resend** — alerta de bounce ou DMARC fail.
- **Vercel** — alertas de build/deploy fail.
- **Reporte do usuário** — staff Luma via canal interno.

## Quem responde

Definir contrato com Luma (single-dev hoje, então):

- **Horário comercial BR (08h-18h):** dev responde em até 1h.
- **Fora de horário:** best-effort. Sev1 acordado por SMS pelo on-call Luma.
- **Vacation cover:** comunicar com 7 dias de antecedência.

## Procedimento (Sev1/2)

1. **Reconhecer** — postar em canal interno (`#luma-gtc-alerts`) "investigando".
2. **Diagnose**:
   - `/api/health` 200? Se não, DB ou app down.
   - Sentry: erro novo? Que rota?
   - Vercel: último deploy quebrou? Reverter para o anterior.
   - Neon: dashboard mostra falha? Acionar suporte Neon.
3. **Mitigar** primeiro, **corrigir** depois:
   - Reverter deploy ruim (Vercel → Deployments → Promote anterior).
   - Feature flag para isolar feature quebrada.
   - Em emergência, ativar `MAIL_DISABLED=1` se mailer estiver derrubando rotas.
4. **Comunicar** o buyer afetado se a falha foi visível ao usuário externo.
   Template no fim deste doc.
5. **Post-mortem** em 48h para Sev1. Salvar em `docs/post-mortems/YYYYMMDD-<slug>.md`.
   Incluir: timeline, causa raiz, ações preventivas.

## Comunicação a buyer (template Sev2 visível)

> Olá {buyer_name},
>
> Identificamos uma instabilidade na plataforma Luma Global Trade Command que
> pode ter afetado [submissão de proposta / acompanhamento de status / X]
> entre HH:MM e HH:MM (BRT). O problema foi resolvido às HH:MM.
>
> Sua proposta {reference}, se afetada, [foi reprocessada / segue intacta /
> precisa ser reenviada].
>
> Para esclarecimentos, responda este e-mail.
>
> Equipe Luma

## Escalada

- **DB Neon:** support@neon.tech (ticket via console).
- **Vercel:** support@vercel.com (Pro tem SLA).
- **Resend:** support@resend.com.
- **Upstash:** support@upstash.com.
