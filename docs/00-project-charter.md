# 00 · Project Charter — Luma Global Trade Command

**Estado**: rascunho aprovado · Fase 0
**Última atualização**: 2026-04-20
**Responsáveis**: Luma (negócio) · Spectre (tecnologia)

---

## 1. Propósito

Construir o **sistema operacional digital da Luma** — uma plataforma geoespacial premium que transforma o processo de pré-qualificação de compradores agroexportadores. O comprador (nacional ou internacional) explora a origem produtiva da Luma no Vale do São Francisco, consulta disponibilidade e janela de colheita por produto e país, simula cargas em container, visualiza requisitos documentais/fitossanitários e envia uma **proposta estruturada** para análise comercial e operacional da Luma.

Não é marketplace, não é catálogo, não é landing page. É uma **torre de comando agroexportadora** com ontologia operacional rigorosa e estética natural premium.

## 2. Resultado pretendido

- **Posicionamento internacional premium**: equivalente digital aos grandes players globais de frutas frescas e agroindustrial.
- **Redução do tempo de pré-qualificação de leads** de semanas para dias (eventualmente, horas).
- **Base de dados operacional canônica** que evolui para RegStack, integração ERP/WMS e inteligência de cadeia.
- **Ativo tecnológico que é, ele mesmo, argumento de venda** da Luma — demonstrável em pitches, visitas e feiras.

## 3. Escopo do MVP (resumo executivo)

Cobre as fases **F0 a F10** descritas no plano mestre:

1. Globo interativo e seleção de destino.
2. Transição cinematográfica globo → Vale do São Francisco.
3. Origem visualizada (fazendas, packing, hubs, rotas).
4. Catálogo filtrado por destino (7 produtos, 6 países).
5. Product Passport completo e Field View com fotos aprovadas.
6. Container Builder semi-3D com cálculos e alertas operacionais.
7. Compliance Preview por país×produto.
8. Trade Proposal Engine (Draft → Submitted).
9. Internal Control View para análise da Luma.
10. Admin Console mínimo funcional.
11. Bilíngue PT-BR + EN; auth magic link; deploy em staging.

**Explicitamente fora do MVP**: integração ERP/WMS real, RegStack completo, pagamentos, chat, mobile nativo, otimização de packing 3D real.

## 4. Stakeholders

| Papel | Responsabilidade |
|---|---|
| Patrocinador Luma | Visão de negócio, validação comercial, acesso a dados reais, fotografia do Vale |
| Time comercial Luma | Consumidor do Internal Control View; valida o fluxo de qualificação |
| Operação Luma | Fonte da verdade sobre disponibilidade, colheita e viabilidade |
| Qualidade/Compliance Luma | Fonte da verdade sobre requisitos fitossanitários e documentais |
| Arquiteto-chefe (Spectre) | Decisões de produto e arquitetura |
| Time de engenharia (Spectre) | Implementação, testes, deploy |

## 5. Governança

- **Canon de produto**: documentos `docs/01`, `docs/04`, `docs/05` definem a visão e a experiência. Mudanças de escopo precisam de aprovação do patrocinador Luma e registro em `docs/ADR/`.
- **Canon técnico**: `docs/06`, `docs/12`, `docs/13` definem a ontologia e a arquitetura. Toda decisão técnica reversível vira uma ADR datada em `docs/ADR/`.
- **Guard-rails não-negociáveis**: Seção 17 do plano mestre (replicada em `CLAUDE.md`).
- **Cadência**: revisão semanal (sexta) com demo do estado atual; gate formal entre fases.

## 6. Indicadores de sucesso

| Métrica | Meta MVP | Meta V2 |
|---|---|---|
| FCP (First Contentful Paint) na rota pública | ≤ 3s | ≤ 1,5s |
| 60fps no globo em hardware médio | 100% do tempo | 100% do tempo |
| Tempo médio comprador → proposta submetida | ≤ 10 min | ≤ 5 min |
| Taxa de propostas qualificadas (não-spam) | ≥ 70% | ≥ 85% |
| Lighthouse Performance / Accessibility | ≥ 85 / ≥ 95 | ≥ 90 / ≥ 98 |

## 7. Riscos macro

Referência: Seção 16 do plano mestre. Os três riscos mais críticos a monitorar:

- **R1** — globo bonito, UX confusa. Mitigação: FSM de canvas rigorosa e teste de corredor até F5.
- **R6** — compliance comunicado como definitivo. Mitigação: toda superfície envolve "Subject to final validation by Luma".
- **R10** — auth/RLS mal configuradas expondo dados. Mitigação: checklist de segurança em F7; revisão em F10.

## 8. Cronograma-referência

| Fase | Duração | Saída verificável |
|---|---|---|
| F0 | 1 sem | Repo rodando, 5 docs, CI verde |
| F1 | 1,5 sem | Canvas protótipo globo→origem navegável |
| F2 | 1 sem | Schema + seed; tRPC de leitura |
| F3–F6 | 4,5 sem | Buyer journey, passport, container, proposta |
| F7–F9 | 2,5 sem | Internal, admin, compliance, i18n |
| F10 | 1 sem | Polimento, testes, deploy staging |

Total conservador: ~11 semanas.

## 9. Aprovações

- Patrocinador Luma: __________________
- Arquiteto-chefe Spectre: __________________
- Data de aprovação: __________________
