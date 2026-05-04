# Manual de go-live — Luma Global Trade Command

> Quem segue este manual **do início ao fim** deve sair com a plataforma em
> produção, monitorada, com 1 staff e 1 buyer piloto reais usando.

Não pule etapas. Cada seção tem **3 partes**:
- **Fazer** — passos com comandos/cliques.
- **Verificar** — como saber que funcionou.
- **Se falhar** — diagnóstico rápido.

Ordem importa. Se travar em um item, **pare e resolva** antes de seguir.

Tempo total estimado: ~2 dias úteis de trabalho dispersos em ~1–2 semanas
(esperando entregas externas: counsel da Luma, sign-off de fotos).

---

## Fase 0 · Inventário antes de começar

### Acessos que você precisa ter em mãos

- [ ] Conta GitHub com permissão de admin no repositório.
- [ ] Conta Vercel (com Spectre ou Luma como org).
- [ ] Conta Neon (https://console.neon.tech).
- [ ] Conta Resend (https://resend.com).
- [ ] Conta Upstash (https://console.upstash.com).
- [ ] Conta Sentry (https://sentry.io).
- [ ] Conta Mapbox (https://account.mapbox.com).
- [ ] Conta Better Uptime ou UptimeRobot (uptime monitor).
- [ ] **DNS do domínio Luma** — acesso ao painel onde fica `luma.com.br`
  (Cloudflare, Route 53, Registro.br, etc.). Se não for você, alinhe com
  quem é antes de começar.
- [ ] Inbox real `commercial@luma.com.br` (ou equivalente) — para receber
  notificações internas. **Confirme com a Luma quem deve estar nessa
  inbox.**

### Decisões que você precisa fechar com Luma antes de começar

- [ ] Subdomínio definitivo. Sugestão: `gtc.luma.com.br`. Alternativas:
  `command.luma.com.br`, `trade.luma.com.br`. **Decisão final?** ____
- [ ] E-mail "from" das notificações. Sugestão: `noreply@luma.com.br`.
  **Decisão final?** ____
- [ ] Inbox interna comercial. **Decisão final?** ____
- [ ] DPO / contato LGPD. Sugestão: `privacy@luma.com.br`. **Decisão final?** ____
- [ ] Lista nominal dos ≤5 buyers piloto. **Quem?** ____
- [ ] SLA com Luma: melhor esforço em horário comercial BR? On-call 24×7?
  **Acordo?** ____

> Se algum desses estiver "TBD", pare aqui. **Não prossiga sem essas
> definições** — elas amarram contratos, env vars e LGPD.

---

## Fase 1 · Provisionar infraestrutura

### 1.1 Neon Postgres (15 min)

**Fazer:**
1. https://console.neon.tech → New project.
2. Nome: `luma-gtc-prod`. Postgres 16. **Region: São Paulo (sa-east-1)** — colocar perto do Vercel `gru1` evita cold-start lento.
3. Em **Settings → Storage**: ative **Point-in-Time Restore**, retenção mínima 7 dias.
4. Crie uma branch chamada `preview` a partir da `main`:
   - Branches → New branch → source: `main` → name: `preview`. Sem dados copiados (ou com, sua escolha).
5. Para **cada branch** (main e preview), capture 2 connection strings:
   - **Pooled** (com `?pgbouncer=true&connect_timeout=10`) → vai para `DATABASE_URL`.
   - **Direct** (sem pgbouncer, usado por `prisma migrate deploy`) → vai para `DIRECT_URL`.

**Verificar:**
- Via `psql` na string direta, rodar `SELECT now();` retorna timestamp.
- No painel Neon, a branch `preview` aparece com status verde.

**Se falhar:** verifique IP allow-list (Neon free não restringe; Pro pode ter rules).

---

### 1.2 Resend + DNS (45 min — inclui propagação)

**Fazer:**
1. https://resend.com/api-keys → criar API key chamada `luma-gtc-prod`. **Copie agora** (só aparece uma vez). Vai para `SMTP_PASSWORD`.
2. https://resend.com/domains → Add domain → `luma.com.br`.
3. Resend mostra registros TXT/MX/CNAME para SPF, DKIM, DMARC. **Copie para o painel DNS Luma**:
   - SPF (TXT em `@` ou `send`): `v=spf1 include:amazonses.com ~all` (ou o valor que Resend exibe).
   - DKIM (3 CNAMEs em `resend._domainkey`...).
   - DMARC (TXT em `_dmarc`): `v=DMARC1; p=quarantine; rua=mailto:dmarc@luma.com.br`.
4. Aguarde propagação DNS (5–60 min). Resend mostra **"verified"** quando os 3 ficam verdes.

**Verificar:**
- Resend domain page mostra todos os 3 registros como **verified**.
- `dig +short TXT luma.com.br | grep spf` retorna a linha SPF.
- `dig +short TXT _dmarc.luma.com.br` retorna a linha DMARC.

**Se falhar:** propagação demora mais quando o registrar é antigo. Aguarde 1h. Se ainda falhar, valide que copiou os valores **sem aspas extras** e que o nome do registro está correto (Resend exige `resend._domainkey.luma.com.br`).

---

### 1.3 Upstash Redis (10 min)

**Fazer:**
1. https://console.upstash.com → Create Database.
2. Type: **Regional** (mais barato/simples). Region: `us-east-1` (latência baixa para Vercel).
3. Name: `luma-gtc-ratelimit`.
4. Capture do REST snippet:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**Verificar:**
```bash
curl -X POST "$UPSTASH_REDIS_REST_URL/set/test/hello" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
# {"result":"OK"}
```

---

### 1.4 Sentry (10 min)

**Fazer:**
1. https://sentry.io → New project → Platform: **Next.js**.
2. Nome: `luma-gtc`. Organização: a que Luma usa (ou crie `luma`).
3. Capture na criação:
   - `SENTRY_DSN` (server)
   - `NEXT_PUBLIC_SENTRY_DSN` (mesma DSN, mas exposta no client)
   - `SENTRY_ORG`
   - `SENTRY_PROJECT` (`luma-gtc`)
4. **Auth token** para upload de sourcemaps no build:
   - Settings → Account → API → Auth Tokens → Create New
   - Scope: `project:releases`, `org:read`. Nome: `vercel-build`.
   - `SENTRY_AUTH_TOKEN`.
5. **Alertas** (em 5min):
   - Project → Alerts → Create Alert → "Issue created".
   - Action: send to e-mail (e ao Slack se vocês tiverem workspace).

**Verificar:**
- DSN tem formato `https://...@...ingest.sentry.io/...`.

---

### 1.5 Vercel Blob (5 min)

**Fazer:**
1. Vercel dashboard → projeto Luma GTC → **Storage → Connect Database → Blob → Create**.
2. Após criar, Vercel injeta automaticamente `BLOB_READ_WRITE_TOKEN` nas envs.
3. Para dev local, vá em **".env.local snippet"** e copie para seu `.env`.

**Verificar:**
- `vercel env ls` mostra `BLOB_READ_WRITE_TOKEN` em todos os ambientes.

---

### 1.6 Mapbox token de prod (5 min)

**Fazer:**
1. https://account.mapbox.com/access-tokens → Create token.
2. Name: `luma-gtc-prod`. Scopes públicos default são OK.
3. **Restringir por URL**: `https://gtc.luma.com.br/*` e o domínio Vercel preview (`https://*.vercel.app/*` se quiser previews funcionarem).

**Verificar:** `curl -s "https://api.mapbox.com/geocoding/v5/mapbox.places/Rotterdam.json?access_token=$TOKEN" | jq '.features[0].place_name'` retorna `"Rotterdam, ..."`.

---

### 1.7 Domínio + Vercel Project (15 min)

**Fazer:**
1. No painel Vercel do projeto → **Settings → Domains → Add** → `gtc.luma.com.br`.
2. Vercel mostra um CNAME alvo (ex: `cname.vercel-dns.com`).
3. No painel DNS Luma, criar CNAME `gtc` → `cname.vercel-dns.com`.
4. Aguardar Vercel marcar como **Valid Configuration** + SSL.
5. **Vercel Pro:** se ainda está em Hobby, faça upgrade. Pro libera password protection nativa, logs 7d, SLA.
6. **Region pin:** o `vercel.json` já tem cron. Edite para incluir region:
   ```json
   { "regions": ["gru1"], "crons": [{ "path": "/api/cron/routine-check", "schedule": "0 10 * * *" }] }
   ```
   *(eu já configurei o cron; só precisa adicionar `regions` se quiser baixar latência.)*

**Verificar:**
- `curl -I https://gtc.luma.com.br` retorna 200 (ou 401 do staging gate até você desligar).
- TLS green (Vercel Settings → Domains).

---

## Fase 2 · Configurar env vars no Vercel

Vercel separa em **Production / Preview / Development**. Configure os três.

### 2.1 Lista mestra (use como checklist)

Para **Production**:

| Variável | Origem | Notas |
|---|---|---|
| `DATABASE_URL` | Neon prod (pooled) | Com `?pgbouncer=true&connect_timeout=10`. |
| `DIRECT_URL` | Neon prod (direct) | Para `prisma migrate deploy`. |
| `AUTH_SECRET` | `openssl rand -base64 32` | Único, secret. |
| `AUTH_URL` | `https://gtc.luma.com.br` | Auth.js usa para callback. |
| `NEXTAUTH_URL` | `https://gtc.luma.com.br` | Mesmo valor. |
| `SMTP_HOST` | `smtp.resend.com` | |
| `SMTP_PORT` | `465` | TLS. |
| `SMTP_USER` | `resend` | Literal. |
| `SMTP_PASSWORD` | Resend API key | Da Fase 1.2. |
| `SMTP_FROM` | `Luma Global Trade Command <noreply@luma.com.br>` | |
| `LUMA_INTERNAL_INBOX` | Inbox real definida na Fase 0 | |
| `BLOB_READ_WRITE_TOKEN` | Auto pelo Vercel | Não precisa setar manual. |
| `CRON_SECRET` | `openssl rand -hex 32` | Bearer do `/api/cron/*`. |
| `UPSTASH_REDIS_REST_URL` | Upstash | |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | |
| `SENTRY_DSN` | Sentry | Server-side. |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | Client-side, exposta. |
| `SENTRY_ORG` | Sentry | Build-time. |
| `SENTRY_PROJECT` | `luma-gtc` | Build-time. |
| `SENTRY_AUTH_TOKEN` | Sentry | Build-time, **não exponha**. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox | Restrita por URL. |
| `CSP_ENFORCE` | `0` | Vire `1` só após Fase 4.3. |
| `NODE_ENV` | Auto pelo Vercel | Não precisa setar. |

Para **Preview** (staging):
- Tudo acima + `SITE_PASSWORD` (gerada com `openssl rand -hex 12`) + `SITE_USERNAME=luma`.
- Pode apontar `DATABASE_URL`/`DIRECT_URL` para a branch `preview` do Neon.

Para **Development** (local):
- Tudo no seu `.env` local. Mantenha `SMTP_*` apontando para Mailpit; deixe Upstash/Sentry vazios (no-op).

**Verificar:**
- `vercel env ls` mostra todas as variáveis em todos os ambientes.
- Faça um redeploy depois de setar tudo.

---

## Fase 3 · Aplicar migrations e seed mínimo

### 3.1 Aplicar schema em Neon prod

**Fazer (do seu terminal):**
```bash
DATABASE_URL="<neon-prod-pooled>" \
DIRECT_URL="<neon-prod-direct>" \
pnpm prisma migrate deploy
```

**Verificar:**
- Output diz `All migrations have been successfully applied`.
- Conectar via `psql` e `\dt` lista as tabelas (`users`, `buyer_companies`, `proposals`, etc.).

**Se falhar:** verifique que `DIRECT_URL` é direta (não-pooled). Pgbouncer não suporta DDL.

### 3.2 Seed mínimo controlado (não rode o seed completo)

O seed é narrativo (3 hero buyers fictícios + dados de demo). **Em produção real, pule o seed completo.** Em vez disso, popule somente o que Luma precisa via Admin Console (Fase 5).

Mas você precisa de **dados de referência** mínimos: países e portos. Se o seu seed tem isso separado:

```bash
# No psql conectado à prod, importe seu CSV/SQL de countries+ports.
# Ou rode o seed inteiro com SEED_ALLOWED=1 e depois LIMPE manualmente
# os dados narrativos (buyers fictícios, propostas seed).
```

**Recomendação:** rode o seed completo uma vez em prod (com `SEED_ALLOWED=1`), depois delete via Admin Console as propostas/buyers fictícios (`Hero Imports BV`, etc.). Mantenha países, portos, produtos como base — Luma pode editar via Admin.

**Verificar:**
- `/admin` em produção lista produtos > 0, origens > 0, países > 0.

---

## Fase 4 · Deploy e smoke testing

### 4.1 Primeiro deploy de produção

**Fazer:**
1. Faça um commit qualquer em `main` (ou clique "Redeploy" no Vercel).
2. Vercel build deve rodar `next build` (que internamente chama `prisma generate`). Migrations já foram aplicadas na Fase 3.
3. Deploy concluído → log do build mostra Sentry sourcemaps uploaded.

**Verificar:**
- `https://gtc.luma.com.br` carrega o canvas sem erro de Mapbox.
- DevTools → Network: requests para `api.mapbox.com` retornam 200.
- DevTools → Console: nenhum erro vermelho.
- `https://gtc.luma.com.br/api/health` retorna `{"ok":true,"db":{"ok":true,"ms":<200},"commit":"..."}` em < 1s.

**Se falhar:**
- 500 no `/api/health` → DB conexão; verifique `DATABASE_URL`.
- Mapbox tile vazio → token errado ou domain restriction; verifique no painel Mapbox.

### 4.2 Smoke 5 minutos no canvas

1. Sem login, abra `/`. Globo carrega.
2. Selecione um país de destino. Transição roda. Origin Map aparece.
3. Abra um produto. Passport abre.
4. Clique "Configurar container". Adicione um item.
5. Clique "Submeter proposta". **Não confirma** ainda — só veja que abriu o form.

### 4.3 CSP report-only → enforcing

**Fazer:**
1. Deploy está com `CSP_ENFORCE=0` (Report-Only).
2. **Use a aplicação por 24h** em staging ou prod (após go-live limitado).
3. Revisar Sentry/Logs por violations: DevTools → Console mostra
   `[Report Only] Refused to load ...`. Cada uma é uma fonte que CSP bloquearia.
4. Para cada violation legítima:
   - Edite `next.config.mjs` → ajuste a diretiva (`script-src`, `connect-src`, etc.).
   - Commit + redeploy.
5. Quando 24h passar **sem violations inesperadas**, flipe `CSP_ENFORCE=1` no Vercel env e redeploy.

**Verificar:**
- https://securityheaders.com/?q=https://gtc.luma.com.br&followRedirects=on → nota **A** ou **A+**.
- DevTools → Network → headers do request raiz contém `content-security-policy:` (sem o sufixo `-report-only`).

---

## Fase 5 · Curadoria de dados reais (Luma owns)

Esta fase é **da Luma**, não sua. Seu papel é facilitar.

### 5.1 Criar conta admin Luma

Você precisa criar **uma conta admin** para que Luma assuma o controle do Admin Console. Faça via SQL na primeira vez:

```sql
INSERT INTO users (id, email, name, role)
VALUES (gen_random_uuid(), 'admin@luma.com.br', 'Admin Luma', 'ADMIN');

INSERT INTO staff_members (id, "userId", team)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'admin@luma.com.br'),
  'ADMIN'
);
```

Mande para Luma:
> "Acesse https://gtc.luma.com.br/auth/sign-in, digite `admin@luma.com.br`. Você receberá um link por e-mail. Esse link te leva ao Admin Console."

**Verificar:** Luma consegue logar e acessar `/admin`.

### 5.2 Luma sobe os dados reais

A Luma usa Admin Console para:

- `/admin/products` → CRUD de produtos. Subir 7 produtos reais.
- `/admin/availability` → janelas e estados de disponibilidade.
- `/admin/harvest-windows` → cronograma de colheitas.
- `/admin/photos` → upload + aprovação. Suba 2–3 fotos por produto.
- `/admin/requirements` → matriz compliance (6 países × 7 produtos).
- `/admin/origins` → fazendas/parceiros. Mínimo 1.
- `/admin/staff` → convidar Luma comercial/operações/compliance.

**Critério de aceite:** `/admin` mostra ≥ 10 produtos, ≥ 1 origem, fotos pendentes = 0.

### 5.3 Counsel da Luma revisa Privacy/Terms

Os arquivos `app/legal/privacy/page.tsx`, `app/legal/terms/page.tsx`, `app/legal/cookies/page.tsx` têm placeholders honestos com tag "pendente de revisão jurídica".

**Counsel da Luma**:
1. Lê os 3 arquivos (você pode mandar como PDF ou link).
2. Devolve versão final em texto.
3. Você substitui o conteúdo dentro da tag `<>` em cada page.tsx.
4. Remove o aviso de placeholder (`<p className="text-[11px] uppercase ...">`).
5. Commit + deploy.

**Verificar:** as 3 páginas no ar refletem texto final, sem aviso de placeholder.

---

## Fase 6 · Testes ponta-a-ponta (manual, antes de soltar buyer real)

Use staging (ou um buyer fake em prod chamado `qa@luma.com.br`).

### 6.1 Fluxo de signup público

1. Abrir `/signup` em **navegador anônimo**.
2. Preencher form com e-mail novo (ex: `qa+1@luma.com.br`).
3. **Marcar checkbox** dos termos. Submit.
4. Verificar:
   - [ ] Página de sucesso aparece.
   - [ ] Inbox `LUMA_INTERNAL_INBOX` recebe e-mail "Novo cadastro pendente".
   - [ ] No `/admin/buyers` (logado como admin), o buyer aparece em PENDING.
5. Tentar submeter o form **6 vezes seguidas** rapidamente:
   - [ ] A partir da 4ª, a UI mostra "Muitas tentativas. Tente novamente em alguns minutos." (rate limit funcionando).

### 6.2 Aprovação manual (admin)

1. Como admin, abra `/admin/buyers/[id]` do buyer da 6.1.
2. Clicar **Aprovar**.
3. Verificar:
   - [ ] Buyer recebe e-mail "Acesso aprovado".
   - [ ] Status muda para APPROVED na lista.
   - [ ] Audit trail registra a aprovação.

### 6.3 Onboarding + canvas + submit

1. Buyer clica no link do e-mail aprovado → cai em `/auth/sign-in`.
2. Digita e-mail → recebe magic link.
3. Magic link → cai em `/onboarding`.
4. Preenche e submete onboarding → cai no canvas (`/`).
5. Configura container, submete proposta.
6. Verificar:
   - [ ] Buyer recebe e-mail "Proposta recebida — REF-XXXX".
   - [ ] Inbox interna recebe "Nova proposta — REF-XXXX".
   - [ ] No `/buyer/proposals`, a proposta aparece com status SUBMITTED.

### 6.4 Loop de transição (staff → buyer)

1. Staff (em outra aba/login) abre `/internal/proposals`, encontra a proposta.
2. Transiciona: SUBMITTED → UNDER_COMMERCIAL_REVIEW.
3. Verificar:
   - [ ] Buyer recebe e-mail "Sua proposta entrou em análise comercial".
   - [ ] Buyer vê o status atualizado em `/buyer/proposals/REF-XXXX`.
4. Staff transiciona para ADJUSTMENT_REQUESTED com nota TO_BUYER ("Por favor reduza para 80% do container.").
5. Verificar:
   - [ ] Buyer recebe e-mail "Ajuste solicitado".
   - [ ] Em `/buyer/proposals/REF-XXXX`, a nota TO_BUYER aparece + form de **Resubmit** está visível.
6. Buyer escreve resposta no form de resubmit, clica Reenviar.
7. Verificar:
   - [ ] Status volta para UNDER_COMMERCIAL_REVIEW.
   - [ ] Inbox interna recebe novo "Nova proposta — REF-XXXX".
   - [ ] Audit trail mostra `ADJUSTMENT_REQUESTED → UNDER_COMMERCIAL_REVIEW` com a nota FROM_BUYER.
8. Repita até passar por **todos** os status que mandam e-mail:
   `UNDER_OPERATIONAL_REVIEW`, `DOCUMENTATION_REVIEW_REQUIRED`,
   `APPROVED_FOR_NEGOTIATION`, `REJECTED`, `CONVERTED_TO_OPERATION`.
9. Para cada um, confirmar buyer recebe e-mail correspondente.

### 6.5 PDF

1. Em `/buyer/proposals/REF-XXXX`, clicar "PDF".
2. Verificar:
   - [ ] Download abre.
   - [ ] PDF tem: referência, destino, container, items, status, notas TO_BUYER, "Subject to final validation by Luma".
   - [ ] **NÃO tem preço.**

### 6.6 Field operator + cron

1. Como admin, criar um Field Operator em `/admin/origins/[slug]` (associar e-mail a uma origin).
2. Logar como Field Operator → cai em `/field`.
3. Submeter foto pequena (~5 MB original):
   - [ ] DevTools → Network mostra request de upload com payload < 1.5 MB (compressão funcionando).
   - [ ] Foto aparece em `/admin/photos` como pendente.
4. Forçar cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://gtc.luma.com.br/api/cron/routine-check`.
5. Se houver plot com routine vencida: e-mail chega em `LUMA_INTERNAL_INBOX` e no operador.

### 6.7 Health & uptime

1. `curl -i https://gtc.luma.com.br/api/health` → 200 com `{"ok":true,"db":{"ok":true,"ms":<200}}`.
2. Configurar Better Uptime / UptimeRobot com check 1min nesse URL. Alerta no e-mail.

### 6.8 Sentry sanity

1. Provoque um erro em prod: visite uma URL que não existe que dispara um erro server-side, ou peça para um dev triggerar `throw new Error('sentry-test')` em uma rota não-crítica.
2. Verificar:
   - [ ] Sentry recebe o issue em < 30s.
   - [ ] Source maps resolvem (você vê o nome do arquivo TS, não o transpiled).
   - [ ] Alerta de e-mail dispara conforme configurado.

### 6.9 Cookie banner

1. Abrir `/` em navegador anônimo.
2. Banner aparece no rodapé.
3. Clicar "Só essenciais".
4. Recarregar — banner não aparece mais.
5. Em DevTools → Application → Cookies, ver `luma_consent=essential-only`.
6. Visitar `/legal/cookies?reset=1` → banner volta.

### 6.10 Restore drill (1 vez antes de go-live)

Seguir `docs/runbooks/restore.md` seção "Drill". Tempo total esperado: < 15 min.

---

## Fase 7 · Branch protection + CI

**Fazer:**
1. GitHub → repo Settings → Branches → Add branch protection rule for `main`:
   - Require pull request before merging.
   - Require status checks: `lint`, `typecheck`, `test`, `build`, `lighthouse`.
   - Require linear history.
   - Require signed commits (se Luma exigir).
2. Conferir `.github/workflows/ci.yml` está rodando todos esses jobs. Se faltar `lighthouse`, adicionar:
   ```yaml
   - name: Lighthouse CI
     run: pnpm dlx @lhci/cli autorun --collect.url=$PREVIEW_URL
   ```
   *(Há uma ação que usa `lhci-action` se preferir.)*

**Verificar:** abrir um PR pequeno; ver checks rodarem; só consegue merge depois que tudo passar.

---

## Fase 8 · Go-live limitado (≤ 5 buyers piloto)

### 8.1 Provisionar piloto

Para cada buyer piloto da lista combinada com Luma:
1. Como admin, `/admin/buyers/new` → preencher → checkbox "enviar magic link" marcado → criar.
2. Buyer recebe magic link, completa onboarding, envia 1ª proposta-teste.

### 8.2 Comunicação ao buyer piloto

Mande um e-mail (ou peça para Luma comercial mandar) com:
> "Olá {nome}, liberamos seu acesso à plataforma Luma Global Trade Command —
> nosso novo canal direto para conhecer origem, configurar carga e propor
> compras. Acesse https://gtc.luma.com.br. Use seu e-mail {email} para entrar.
> Qualquer feedback é muito bem-vindo nas primeiras semanas."

### 8.3 Monitoramento intensivo (2 semanas)

Diariamente:
- Sentry: novos issues?
- Uptime monitor: 100%? Latência média?
- `/admin`: novas propostas? buyers travados em PENDING?
- Resend: bounces? DMARC reports?

Toda sexta:
- 30min de fix-list para a próxima sprint.
- Pinging cada buyer piloto: "Como tem sido?"

### 8.4 Sinal verde para abertura full

Após 2 semanas:
- 0 incidentes Sev1.
- < 5 incidentes Sev2.
- Feedback dos pilotos majoritariamente positivo.
- Backlog de fixes triado.

→ Abra para o restante da carteira Luma.

---

## Anexos rápidos

### Comandos úteis

```bash
# Conectar a Neon prod via psql
psql "$DATABASE_URL"

# Aplicar migration nova em prod
DATABASE_URL=<pooled> DIRECT_URL=<direct> pnpm prisma migrate deploy

# Ver logs em tempo real do Vercel
vercel logs --follow gtc.luma.com.br

# Forçar cron manualmente
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://gtc.luma.com.br/api/cron/routine-check

# Promover preview para prod
vercel promote <preview-url>

# Rebuild sem mudar código (após mudar env var)
vercel redeploy
```

### Onde encontrar cada coisa

- **Dashboard de saúde:** `/admin` (após login admin).
- **Logs runtime:** Vercel → Project → Logs.
- **Erros:** Sentry project `luma-gtc`.
- **DB direto:** Neon console → SQL Editor.
- **Mail enviado:** Resend → Emails (mostra delivery status).
- **Rate limit hits:** Upstash → Database → Data Browser → keys com prefixo `rl:`.
- **Uptime:** Better Uptime / UptimeRobot dashboard.

### Quando algo der ruim

1. Calma. `/api/health` mostra DB up?
2. Se 503: olha Neon dashboard.
3. Se 500: olha Sentry; achou o issue?
4. Se nada óbvio: reverter último deploy. `vercel promote` para o anterior.
5. Se afetou buyer real: comunicar via template em `docs/runbooks/incident-response.md`.
6. Post-mortem em até 48h se for Sev1.

---

## Final — checklist de saída

- [ ] Todas as 8 fases executadas.
- [ ] Todos os items de `docs/golive/checklist.md` marcados.
- [ ] Counsel da Luma assinou Privacy/Terms finais.
- [ ] ≥ 1 staff Luma + ≥ 1 buyer piloto usando ativamente.
- [ ] 14 dias de monitoramento limpo.
- [ ] Runbooks atualizados com qualquer aprendizado da fase de piloto.

✅ **Go-live full autorizado.**
