# UrbanLink — Backend

API em Node.js + Express que atua como **proxy seguro** para a
[API Olho Vivo da SPTrans](https://www.sptrans.com.br/desenvolvedores/).
O frontend nunca fala direto com a SPTrans: a API Key vive somente aqui.

## Pré-requisitos

- Node.js >= 20 (testado com 24)
- Uma API Key da SPTrans (gerada em "Meus Aplicativos" no portal do desenvolvedor)

## Setup

```bash
cd backend
npm install
cp .env.example .env   # no Windows: copy .env.example .env
```

Edite `backend/.env` e preencha `SPTRANS_API_KEY`. O `.env` está no `.gitignore`
e **nunca** deve ser commitado.

| Variável           | Descrição                                             | Padrão                                          |
| ------------------ | ----------------------------------------------------- | ---------------------------------------------- |
| `PORT`             | Porta HTTP do backend                                 | `3333`                                          |
| `NODE_ENV`         | `development` ou `production`                         | `development`                                  |
| `SPTRANS_API_KEY`  | Chave da API Olho Vivo (**obrigatória**)              | —                                              |
| `SPTRANS_BASE_URL` | URL base da API da SPTrans                             | `https://api.olhovivo.sptrans.com.br/v2.1`      |
| `CORS_ORIGIN`      | Origem liberada no CORS (URL do frontend)             | `http://localhost:5173`                         |

## Rodando

```bash
npm run dev    # com reload automático (node --watch)
npm start      # produção
```

## Endpoints

Todas as rotas ficam sob `/api` e são limitadas a 60 requisições/minuto por IP.

### `GET /api/health`

Liveness check. Não consome sessão da SPTrans.

```json
{ "status": "ok", "uptimeSeconds": 12, "sptransSessao": "ativa" }
```

### `GET /api/linhas/buscar?termosBusca=<termo>`

Busca linhas por número ou nome (parcial). Proxy de `/Linha/Buscar`.

```bash
curl "http://localhost:3333/api/linhas/buscar?termosBusca=8000"
```

```json
{
  "termosBusca": "8000",
  "total": 4,
  "linhas": [{ "cl": 1273, "lt": "8000", "sl": 1, "tp": "PÇA. RAMOS DE AZEVEDO", "ts": "TERM. LAPA" }]
}
```

`cl` é o código interno da linha, usado no endpoint de posições.

### `GET /api/linhas/:codigoLinha/posicoes`

Posição em tempo real dos veículos da linha. Proxy de `/Posicao/Linha`.
Base para a validação de presença (Fase 3).

```bash
curl "http://localhost:3333/api/linhas/1273/posicoes"
```

```json
{
  "hr": "17:07",
  "vs": [{ "p": "11524", "a": true, "ta": "2026-09-05T20:06:23Z", "py": -23.5476, "px": -46.641 }]
}
```

`py` = latitude, `px` = longitude, `ta` = timestamp UTC da captura.

## Estrutura

```
backend/src/
├─ server.js              # entrypoint: sobe o HTTP e trata shutdown
├─ app.js                 # monta o Express (helmet, cors, rate limit, rotas)
├─ config/env.js          # lê e valida variáveis de ambiente
├─ services/
│  └─ sptransClient.js    # auth + cookie de sessão + reauth + wrappers
├─ routes/
│  ├─ health.js
│  └─ linhas.js           # validação de input (zod) + proxy
├─ middleware/
│  └─ errorHandler.js     # 404 e handler de erros central
└─ utils/
   ├─ asyncHandler.js
   └─ logger.js
```

## Segurança aplicada

- API Key só no backend, carregada de `.env` (fora do versionamento).
- `helmet` para headers de segurança; `cors` restrito à origem do frontend.
- Rate limiting (60 req/min por IP) protege contra abuso e estouro de cota da SPTrans.
- Validação e sanitização de todos os parâmetros de entrada com `zod`.
- Erros da SPTrans e internos nunca vazam stack trace ao cliente.
