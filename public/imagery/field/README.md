# public/imagery/field/

Pasta-drop para fotografias reais de campo do Vale do São Francisco fornecidas pela Luma.

**Regras**:

- Formatos aceitos: `.jpg` / `.jpeg` / `.png` (otimizar antes de commitar).
- Cada foto corresponde a um registro `FieldPhoto` no banco, vinculada a um `FieldUpdate`.
- Fotos só aparecem para compradores na UI pública se `approvedForBuyerView=true` **E** `approvedByUserId` não for nulo.
- Arquivos `*.jpg|jpeg|png` dentro desta pasta são **ignorados pelo git** por padrão (ver `.gitignore`). Esse README é a exceção committada.

**Fluxo recomendado** (F4+):

1. Lote de fotos chega → operador do admin coloca aqui em subpasta por origem (ex.: `fazenda-vale-norte/`).
2. Script de import (a ser criado em F4) gera variantes (thumbnail, médio, full), redimensiona e registra `FieldPhoto` como "pendente".
3. Usuário com `role=ADMIN` (ou STAFF com `team=OPERATIONS`) abre a fila de aprovação e marca `approvedForBuyerView=true`.
4. Foto passa a ser servida via rota Next.js assinada (HMAC com TTL curta).

**Governança**:

- Nunca commitar fotos que identifiquem parceiros sem autorização explícita do contratante.
- Arquivar originais fora do repo (storage bucket dedicado) antes de qualquer deploy.
