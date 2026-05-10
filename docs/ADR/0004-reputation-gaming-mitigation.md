# ADR 0004 — Reputation gaming mitigation (MVP scope)

- **Date:** 2026-05-10
- **Status:** Accepted
- **Related:** ADR 0003 (pivot), `docs/06` §13.

## Contexto

Em F4 a reputação passa a ser exibida como sinais decompostos no perfil da empresa e a influenciar o ranking em `/discover`. Reputação = identidade + prova + execução + comportamento + contexto. O risco óbvio é **gaming**: duas empresas conluiadas abrem deals fictícios, sobem evidência placeholder, confirmam, ganham reputação artificialmente.

Este ADR documenta o que **escolhemos não resolver no MVP** e o que escolhemos cobrir, para que o trade-off seja explícito.

## Decisão (MVP)

Apenas três proteções, deliberadamente simples:

1. **Review só nasce de transição `CONFIRMED` real**.
   - `Review` é criado em `ensureReviewsForConfirmedDeal` apenas quando `DealRoom.status ∈ { CONFIRMED, CLOSED }`.
   - Constraint `@@unique([dealRoomId, raterCompanyId])` garante 1 review por par-deal.
   - UI bloqueia review fora desse contexto (procedure `review.submit` exige `raterCompanyId === ctx.user.companyId`).
2. **Sinais decompostos, não score único**.
   - `ReputationBadge` mostra `confirmedDealsCount`, `avgRating + totalReviews`, `recurringClientsCount`, `disputeRate` separadamente. Um sinal isolado (ex: 5 estrelas com 1 review) não inflate o ranking — `discovery.search` ranqueia primeiro por verificação, depois por número de deals concluídos.
3. **AuditEvent imutável** registra todas as transições. Detecção forense de padrões anômalos (mesmo par de empresas concluindo N deals em curto intervalo) é viável, mas é **operação manual em F4**.

## O que NÃO está no MVP

Documentado para evitar revisita reativa:

- **Rate-limit por par de empresas**: o plano original mencionava "1 deal/par/30 dias conta para reputação". Não implementado em F4 — adiciona complexidade ao `computeReputation` e exige granularidade temporal extra. Justificativa: até termos liquidez real, o risco é teórico; antes de chegarmos a 100 deals concluídos na plataforma, não vale otimizar contra gaming hipotético.
- **Verificação de pagamento real**: nada na plataforma observa que dinheiro trocou de mãos. `quoteCents` é declarado pelas próprias partes. Resolver isso exigiria ou (a) escrow integrado (fora de escopo MVP, ver `docs/06` §5) ou (b) integração bancária para confirmação de transferência (idem).
- **Detecção de conluio por padrões**: nenhum heurístico ativo. Operação manual via SQL no Adminer / dashboard de admin futuro.
- **Reputação ponderada por categoria/ticket**: `topCategories` é exibido mas não pondera ranking. Categorias do supplier servem como contexto; reputação por categoria virá quando `Review.category` tiver volume.
- **Identidade reforçada além de DOC_VERIFIED**: revisão manual de cartão CNPJ é o teto MVP. Validações fiscais ativas (consulta SERPRO, comprovação de endereço in loco, KYC do representante) ficam para fase pós-MVP.

## Quando revisitar

Reabrir este ADR quando **qualquer um** dos gatilhos disparar:

1. ≥ 100 deals concluídos (volume torna gaming viável e detectável).
2. Primeiro caso real reportado de manipulação de reputação.
3. Investidor/parceiro exigir auditoria externa do score (sinal de que a opacidade do método se tornou um problema de credibilidade).

Em qualquer um desses, prioridades:
- Implementar rate-limit por par + janela temporal.
- Job noturno de detecção de anomalias (deals concluídos em < 24h, volume desproporcional ao histórico, etc.).
- Considerar `ReputationFreeze` flag em `Company` para sinalizar caso sob investigação.

## Consequências aceitas

- Empresas pioneiras com 1–3 deals reais terão reputação **menos diferenciada** de eventuais cluster sintéticos. Aceitável: o ranking ainda privilegia `verificationStatus = DOC_VERIFIED`, que exige revisão manual humana — gargalo natural contra fraude em massa.
- O sistema é honesto sobre seus limites. `ReputationBadge` deixa claro que reputação aparece após o primeiro deal confirmado, sem falsa precisão.
