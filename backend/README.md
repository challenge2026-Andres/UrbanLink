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
| `VALIDATION_RADIUS_M` | Raio (m) entre celular e ônibus para o check-in valer | `150`                                       |
| `SPTRANS_POSITION_MAX_AGE_S` | Idade máxima (s) da captura da SPTrans      | `90`                                            |
| `MAX_PHOTO_BYTES` | Tamanho máximo da foto enviada na validação            | `2097152` (2 MiB)                               |
| `VALIDATION_BYPASS` | **Só dev:** `true` aceita qualquer trajeto (ignorado se `NODE_ENV=production`) | `false`             |

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

### `POST /api/trajetos/validar`

Valida a presença do usuário num trajeto: compara o GPS do celular com a posição
real dos veículos da linha (Haversine + raio de tolerância + checagem de recência).
A foto é inspecionada e registrada em log (mime, bytes, hash) — **não é armazenada**.

```jsonc
// corpo
{
  "codigoLinha": 609,
  "linha": { "lt": "875A", "sl": 1, "tp": "PERDIZES", "ts": "AEROPORTO" },
  "lat": -23.5462, "lng": -46.6466, "accuracy": 18,
  "capturadoEm": "2026-09-05T20:45:00.000Z",
  "foto": "data:image/jpeg;base64,..."
}
```

```jsonc
// resposta (quando válido, registra o trajeto e credita pontos + Ecoa)
{
  "valido": true,
  "motivo": null,                     // ou "fora_do_raio" | "sem_veiculos" | "posicao_desatualizada" | "timestamp_invalido"
  "validadoEm": "2026-09-05T20:45:03.915Z",
  "detalhes": { "raioToleranciaM": 150, "distanciaMetros": 42, "veiculoMaisProximo": {…}, "horaConsultaSptrans": "17:46", "veiculosNaLinha": 5 },
  "recompensa": { "distanciaKm": 7, "co2EvitadoKg": 0.57, "pontos": 52, "ecoa": 52 },
  "desafioConcluido": false,
  "foto": { "recebida": true, "bytes": 84213, "sha256": "..." }
}
```

### `GET /api/perfil`

Perfil consolidado: `{ nome, pontos, ecoaSaldo, nivel, impacto: { trajetos, distanciaKm, co2EvitadoKg }, desafioSemana, conquistas }`.

### `GET /api/carteira`

`{ saldo, opcoesResgate: [{ id, titulo, descricao, icone, custo }], historico: [{ tipo, descricao, detalhe, valor, em }] }`.

### `POST /api/carteira/resgatar`

Corpo `{ "opcaoId": "passagem" }`. Debita o custo do saldo Ecoa e registra o lançamento.
Retorna `{ saldo, resgate }` (409 se saldo insuficiente).

### `POST /api/dev/reset` (só fora de produção)

Zera os dados de gamificação (usuário demo, trajetos, carteira).

## Estrutura

```
backend/
├─ data/store.json        # persistência (gitignored, criado em runtime)
└─ src/
   ├─ server.js           # entrypoint: sobe o HTTP e trata shutdown
   ├─ app.js              # monta o Express (helmet, cors, rate limit, rotas)
   ├─ config/env.js       # lê e valida variáveis de ambiente
   ├─ store/store.js      # leitura/escrita do store JSON
   ├─ services/
   │  ├─ sptransClient.js    # auth + cookie de sessão + reauth + wrappers
   │  ├─ validacaoTrajeto.js # compara GPS do celular x posição real dos ônibus
   │  ├─ gamificacao.js      # fórmulas de CO₂, pontos, nível, desafio
   │  ├─ perfil.js           # monta perfil e carteira (views)
   │  └─ recompensas.js      # credita trajeto, resgata Ecoa (mutações)
   ├─ routes/               # health, linhas, trajetos, perfil, carteira, dev
   ├─ middleware/errorHandler.js
   └─ utils/               # asyncHandler, foto, geo (Haversine), logger
```

## Gamificação (metodologia)

- **CO₂ evitado** = `distância × (fator_carro − fator_ônibus)` com fatores de emissão
  por passageiro-km (env vars, padrão 0,171 / 0,089 kg CO₂/km).
- **Distância**: estimativa fixa por trajeto (`DISTANCIA_MEDIA_KM`, padrão 7 km).
  Simplificação deliberada — a evolução é medir a distância real com check-in + check-out.
- **Pontos** = `PONTOS_BASE + round(distância × PONTOS_POR_KM)`; `Ecoa = pontos`.
- **Nível** por total de trajetos (`TRAJETOS_POR_NIVEL`, padrão 3).
- **Desafio semanal**: N trajetos numa semana ISO → bônus em Ecoa, creditado uma vez.

## Segurança aplicada

- API Key só no backend, carregada de `.env` (fora do versionamento).
- `helmet` para headers de segurança; `cors` restrito à origem do frontend.
- Rate limiting (60 req/min por IP) protege contra abuso e estouro de cota da SPTrans.
- Validação e sanitização de todos os parâmetros de entrada com `zod`.
- Erros da SPTrans e internos nunca vazam stack trace ao cliente.
- Corpo JSON limitado por rota (a foto só é aceita em `/api/trajetos`); a imagem
  é validada por mime/tamanho e **não é persistida**.
- Checagem de _clock skew_ do horário informado pelo cliente (anti-replay).
