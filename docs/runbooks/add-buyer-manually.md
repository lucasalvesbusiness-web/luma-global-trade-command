# Runbook — Adicionar buyer manualmente

## Quando usar

- Buyer já é cliente Luma offline e Luma quer pré-aprová-lo sem que ele passe
  pelo signup público.
- Pilotos iniciais (≤5 buyers) onde queremos controlar a entrada um a um.
- Recriar conta após exclusão acidental.

## Pré-requisitos

- Sua conta tem `role = ADMIN` no DB.
- Você tem o e-mail corporativo do buyer.
- Você confirmou com Luma que o buyer está autorizado.

## Procedimento (UI)

> **Status:** o caminho UI vive em F17. Até lá, use o procedimento via SQL
> abaixo.

(Aqui ficará o passo-a-passo de `/admin/buyers/new` quando F17 entrar.)

## Procedimento (SQL — interim)

1. Acesse Adminer (dev) ou Neon SQL Editor (prod).
2. Crie o User + BuyerCompany + Buyer numa única transação:

```sql
BEGIN;

INSERT INTO users (id, email, name, role)
VALUES (gen_random_uuid(), 'buyer@example.com', 'Nome do Buyer', 'BUYER')
RETURNING id;
-- guarde o id retornado como :user_id

INSERT INTO buyer_companies (
  id, "legalName", type, "countryIso2",
  "approvalStatus", "approvedAt", "approvedById"
)
VALUES (
  gen_random_uuid(), 'Razão Social S.A.', 'IMPORTER', 'NL',
  'APPROVED', NOW(), :admin_user_id
)
RETURNING id;
-- guarde o id retornado como :company_id

INSERT INTO buyers (id, "userId", "companyId")
VALUES (gen_random_uuid(), :user_id, :company_id);

COMMIT;
```

3. Envie o magic-link manualmente: peça ao buyer para acessar
   `/auth/sign-in`, digitar o e-mail. Auth.js dispara o link.
4. Ao clicar no link, o buyer cai em `/onboarding`. Que ele complete os campos.
5. Confira em `/admin/buyers/{company_id}` que o buyer aparece como APPROVED.

## Verificar

- Buyer consegue acessar `/buyer/proposals`.
- Buyer consegue submeter uma proposta-teste e recebe o e-mail de confirmação.
- O e-mail de submit cai na inbox interna (`LUMA_INTERNAL_INBOX`).

## Reverter

Se o buyer foi adicionado por engano, mude o status para BLOCKED via Admin
Console ou via SQL:

```sql
UPDATE buyer_companies SET "approvalStatus" = 'BLOCKED' WHERE id = :company_id;
```

Não delete a linha — o buyer pode ter audit history e propostas associadas.
