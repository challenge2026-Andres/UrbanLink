# UrbanLink — Documentação

Documento único de referência do projeto. Para instruções rápidas de setup, veja
o [README.md](README.md); para detalhes de cada lado, [backend/README.md](backend/README.md)
e [frontend/README.md](frontend/README.md).

---

## 1. Visão geral

**UrbanLink** é um app mobile-first que **gamifica o uso do transporte público de
São Paulo para reduzir emissões de CO₂**. O usuário faz um _check-in_ dentro do
ônibus (foto + GPS); o sistema confirma a presença cruzando a localização do
celular com a **posição real dos veículos na API Olho Vivo da SPTrans** e, se tudo
bater, concede pontos e créditos ("Ecoa"). Os créditos podem ser trocados por
benefícios — incluindo crédito de passagem.

Projeto do **Challenge FIAP + SoulUp (2026, 1º semestre)** — tema _"Utilização de
Pontos para Transporte Público"_. A ideia tem duas etapas: primeiro **incentivar**
o uso do transporte (ganhar pontos por trajeto validado); depois **converter**
esses pontos em passagens/benefícios.

### O que está implementado

| Área | Estado |
| --- | --- |
| Proxy seguro da API da SPTrans (auth + sessão) | ✅ |
| Busca de linha e posição de veículos em tempo real | ✅ |
| Validação de presença (GPS × ônibus real, Haversine) | ✅ |
| Captura de foto ao vivo pela câmera | ✅ |
| Análise de conteúdo da foto (é interior de transporte?) | ✅ |
| Gamificação: pontos, CO₂ evitado, nível, desafio semanal | ✅ |
| Carteira Ecoa: saldo, histórico, resgate de benefícios | ✅ |
| 8 telas responsivas (a partir do Figma) | ✅ |
| Login / múltiplos usuários | ❌ (usuário demo único) |
| Distância real do trajeto (check-in + check-out) | ❌ (estimativa fixa) |

---

## 2. Como funciona (fluxo do usuário)

```
Home ──► Novo trajeto ──► Foto (câmera ao vivo) ──► Revisão ──► Processando ──► Resultado
         │ escolhe          │ tira a foto            │ confere    │ envia ao      │ sucesso
         │ transporte       │ do interior            │ os dados   │ backend       │ ou falha
         │ + linha (SPTrans)                                                      │
         │ + captura GPS                                                          ▼
                                                              Meu Impacto / Carteira Ecoa
```

### Modelo de validação (o que o backend checa no check-in)

Para um trajeto ser **válido**, tudo abaixo precisa ser verdade ao mesmo tempo:

1. **Linha em operação** — a linha escolhida tem ao menos um veículo rodando agora.
2. **Proximidade** — o celular está a no máximo **150 m** (`VALIDATION_RADIUS_M`)
   do veículo mais próximo dessa linha (distância de Haversine).
3. **Recência** — a última captura de posição da SPTrans para esse veículo é de
   ≤ **90 s** (`SPTRANS_POSITION_MAX_AGE_S`); senão a comparação não é confiável.
4. **Horário coerente** — o relógio do celular não diverge mais que **5 min** do
   servidor (anti-_replay_).
5. **GPS preciso** — a precisão reportada pelo navegador é ≤ **500 m**
   (`VALIDATION_MAX_ACCURACY_M`); acima disso é "localização aproximada" e a
   checagem de 150 m não faz sentido.
6. **Foto plausível** — (se `IMAGE_ANALYSIS_ENABLED` e modo `blocking`) a foto
   parece o interior de um transporte público.

Se qualquer um falha, o resultado traz um **motivo**:
`sem_veiculos` · `fora_do_raio` · `posicao_desatualizada` · `timestamp_invalido` ·
`precisao_baixa` · `foto_rejeitada`.

---

## 3. Arquitetura

Monorepo simples — duas aplicações independentes, sem ferramenta de workspace:

```
UrbanLink/
├─ backend/          Node.js + Express — proxy da SPTrans + regras + persistência
├─ frontend/         React + Vite + TypeScript — app mobile-first
├─ CHALLENGE.md      arquitetura e regras de operação (spec original)
├─ DOCUMENTACAO.md   este arquivo
└─ README.md         setup rápido
```

```
        ┌────────────┐    HTTPS     ┌───────────────┐   HTTP(S)+cookie  ┌──────────────┐
        │  Navegador │ ───────────► │    Backend    │ ───────────────► │   SPTrans    │
        │  (React)   │   /api/*     │   (Express)   │   Olho Vivo API  │  Olho Vivo   │
        └────────────┘ ◄─────────── └───────────────┘ ◄─────────────── └──────────────┘
         GPS, câmera                 API Key (só aqui)
                                     store.json (pontos/carteira)
                                     modelo CLIP (análise da foto)
```

- A **API Key da SPTrans vive só no backend**. O frontend nunca fala com a SPTrans.
- Em dev, o Vite faz **proxy de `/api`** para `http://localhost:3333` — sem CORS,
  sem _mixed content_.

---

## 4. Backend

### Stack

Node.js ≥ 20 (testado com 24) · Express 5 · zod (validação) · helmet · cors ·
morgan · express-rate-limit · `@huggingface/transformers` (análise de imagem).

### Estrutura

```
backend/
├─ data/store.json            persistência (gitignored, criado em runtime)
└─ src/
   ├─ server.js               entrypoint: sobe o HTTP, shutdown gracioso, aquece o modelo
   ├─ app.js                  monta o Express (helmet, cors, rate limit, rotas)
   ├─ config/env.js           lê e valida TODAS as variáveis de ambiente (falha rápido)
   ├─ store/store.js          leitura/escrita atômica do store JSON
   ├─ services/
   │  ├─ sptransClient.js     auth + cookie de sessão + reauth + wrappers dos endpoints
   │  ├─ validacaoTrajeto.js  compara GPS do celular × posição real dos ônibus
   │  ├─ analiseImagem.js     CLIP zero-shot: a foto é interior de transporte?
   │  ├─ gamificacao.js       fórmulas de CO₂, pontos, nível, desafio semanal
   │  ├─ perfil.js            monta perfil e carteira (views de leitura)
   │  └─ recompensas.js       credita trajeto, resgata Ecoa (mutações do store)
   ├─ routes/                 health · linhas · trajetos · perfil · carteira · dev
   ├─ middleware/errorHandler.js   404 + handler central (nunca vaza stack trace)
   └─ utils/                  asyncHandler · foto (valida/hash) · geo (Haversine) · logger
```

### Endpoints

Tudo sob `/api`, limitado a **60 req/min por IP**.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness. Não consome sessão da SPTrans. |
| `GET` | `/api/linhas/buscar?termosBusca=<t>` | Busca linhas por número/nome. Proxy de `/Linha/Buscar`. |
| `GET` | `/api/linhas/:codigoLinha/posicoes` | Posição em tempo real dos veículos. Proxy de `/Posicao/Linha`. |
| `POST` | `/api/trajetos/validar` | Valida o check-in (GPS + foto + horário). Se válido, credita pontos + Ecoa. |
| `GET` | `/api/perfil` | Perfil: pontos, saldo, nível, impacto, desafio, conquistas. |
| `GET` | `/api/carteira` | Saldo Ecoa, opções de resgate, histórico de lançamentos. |
| `POST` | `/api/carteira/resgatar` | Troca Ecoa por um benefício (`{ opcaoId }`). 409 se saldo insuficiente. |
| `POST` | `/api/dev/reset` | **Só dev.** Zera o store (usuário demo, trajetos, carteira). |
| `GET` | `/api/dev/analise-imagem` | **Só dev.** Relatório de calibração da análise de foto (JSON ou página HTML). |

#### Exemplo — `POST /api/trajetos/validar`

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
// resposta
{
  "valido": true,
  "motivo": null,                       // ou um dos motivos da seção 2
  "validadoEm": "2026-09-05T20:45:03.915Z",
  "detalhes": {
    "raioToleranciaM": 150, "distanciaMetros": 42,
    "veiculoMaisProximo": { "prefixo": "64911", "lat": -23.5, "lng": -46.6, "capturadoEm": "..." },
    "horaConsultaSptrans": "17:46", "veiculosNaLinha": 5
  },
  "recompensa": { "distanciaKm": 7, "co2EvitadoKg": 0.57, "pontos": 52, "ecoa": 52 },
  "desafioConcluido": false,
  "foto": {
    "recebida": true, "bytes": 84213, "sha256": "...",
    "analise": { "executada": true, "aprovada": true, "confianca": 0.998,
                 "rotulo": "interior de ônibus", "modo": "blocking", "status": "ok" }
  }
}
```

### Integração com a SPTrans (Olho Vivo)

- Base: `https://api.olhovivo.sptrans.com.br/v2.1`.
- `POST /Login/Autenticar?token=<API_KEY>` devolve um cookie de sessão
  (`apiCredentials`); o cliente guarda o cookie e **reautentica sozinho** quando a
  sessão expira (resposta 401/403).
- `GET /Linha/Buscar?termosBusca=` → descobre o `cl` (código interno da linha).
- `GET /Posicao/Linha?codigoLinha=` → veículos com `py` (lat), `px` (lng), `ta`
  (timestamp UTC da captura).

### Gamificação — metodologia

Tudo configurável por env var; os valores abaixo são os padrões.

| Item | Fórmula | Notas |
| --- | --- | --- |
| **Distância do trajeto** | fixa: `DISTANCIA_MEDIA_KM` = 7 km | Simplificação deliberada. Evolução: medir com check-in + check-out (Haversine). |
| **CO₂ evitado** | `distância × (fator_carro − fator_ônibus)` | Fatores em kg CO₂ / passageiro-km: carro 0,171, ônibus 0,089 (ordem de grandeza de fatores de emissão de transporte). ≈ 0,082 kg evitados por km. |
| **Pontos** | `PONTOS_BASE + round(km × PONTOS_POR_KM)` | 10 + 7×6 = **52** por trajeto. |
| **Ecoa** | `= pontos` | 1 ponto de gamificação → 1 crédito resgatável. |
| **Nível** | `floor(total_trajetos / TRAJETOS_POR_NIVEL) + 1` | 3 trajetos por nível. Nomes: _Primeiros Passos → Explorador Urbano → Explorador Verde → Guardião da Mobilidade → Lenda Sustentável_. |
| **Desafio semanal** | `DESAFIO_SEMANAL_META` trajetos numa semana ISO | Ao concluir, bônus de `DESAFIO_SEMANAL_RECOMPENSA` (150) Ecoa, creditado uma única vez por semana. |

**Opções de resgate** (`POST /api/carteira/resgatar`): Crédito em passagem (500 Ecoa) ·
Descontos em parceiros (750) · Cashback na conta de energia (1.000).

### Análise de conteúdo da foto

Camada anti-fraude **além do GPS**: confere se a foto é mesmo o **interior de um
transporte público** (ônibus / trem / metrô). Opt-in por `IMAGE_ANALYSIS_ENABLED`.

- **Ferramenta:** modelo **CLIP** (`Xenova/clip-vit-base-patch32`) rodando
  **localmente** no backend via `@huggingface/transformers` — **classificação
  zero-shot de imagem**. A foto (que costuma ter rostos de outros passageiros)
  **nunca sai do servidor**. Custo zero por chamada; ~1 s para carregar o modelo
  no boot, ~100 ms por inferência.
- **Método:** o CLIP compara a imagem com um conjunto de frases candidatas —
  "positivas" (interior de ônibus/trem/metrô) e "negativas" (janela de casa, rua,
  selfie, tela, interior de carro, exterior de veículo…). Os _scores_ somam 1;
  soma-se o das positivas e compara-se com `IMAGE_ANALYSIS_MIN_CONFIDENCE` (0,5).
  As frases estão em `backend/src/services/analiseImagem.js` (em inglês — o CLIP é
  muito mais forte em EN; só o rótulo exibido é traduzido).
- **Modos:** `advisory` (roda, registra e mostra o resultado, mas **não recusa**)
  e `blocking` (foto reprovada → `valido: false`, `motivo: 'foto_rejeitada'`).
  O advisório serve para **calibrar** o limiar com dados reais antes de barrar
  usuário — via `GET /api/dev/analise-imagem`, que mostra histograma de confiança
  (aprovadas × reprovadas) e um **limiar sugerido**. Nada é "treinado": só se
  ajusta o número e/ou as frases.
- **`fail mode`:** se a inferência falhar/estourar timeout, `IMAGE_ANALYSIS_FAIL_MODE`
  decide (`open` aprova, `closed` rejeita).
- **Independente do `VALIDATION_BYPASS`:** o bypass só desliga a checagem de GPS;
  a foto continua sendo analisada.

**Trocar de provedor** para Claude Haiku (descrição em texto livre, ~R$0,01/check-in,
não treina com os dados) ou Gemini Flash pago já está previsto no `switch` de
`analiseImagem.js` — é só configuração.

### Persistência

Arquivo **JSON** (`backend/data/store.json`, _gitignored_, criado no primeiro run).
Um único **usuário de demonstração** ("Ana"). Guarda: usuário (pontos, saldo),
trajetos validados (com a análise da foto), lançamentos da carteira, desafios
semanais concluídos. Para multiusuário/produção, trocar por SQLite/Postgres.

### Segurança aplicada

- API Key só no backend, carregada de `.env` (fora do versionamento).
- `helmet` (headers de segurança) + `cors` restrito à origem do frontend.
- Rate limiting (60 req/min por IP).
- Validação e sanitização de **todos** os parâmetros de entrada com `zod`.
- Corpo JSON limitado por rota — a foto (base64) só é aceita em `/api/trajetos`.
- A foto é validada por mime/tamanho, tem um `sha256` registrado em log, e **não
  é persistida**.
- Checagem de _clock skew_ do horário do cliente (anti-_replay_).
- Erros da SPTrans e internos **nunca** vazam stack trace ao cliente.
- `VALIDATION_BYPASS` é ignorado quando `NODE_ENV=production`.
- Rotas `/api/dev/*` só são montadas fora de produção.

### Variáveis de ambiente

Copie `backend/.env.example` para `backend/.env`. **Só `SPTRANS_API_KEY` é obrigatória.**

| Variável | Padrão | Para quê |
| --- | --- | --- |
| `PORT` | `3333` | Porta HTTP |
| `NODE_ENV` | `development` | `development` \| `production` |
| `SPTRANS_API_KEY` | — | **Obrigatória.** Chave da API Olho Vivo. |
| `SPTRANS_BASE_URL` | `…/v2.1` | URL base da SPTrans |
| `CORS_ORIGIN` | `http://localhost:5173` | Origem liberada no CORS |
| `VALIDATION_RADIUS_M` | `150` | Raio (m) celular ↔ ônibus |
| `VALIDATION_MAX_ACCURACY_M` | `500` | Precisão de GPS máxima aceita |
| `SPTRANS_POSITION_MAX_AGE_S` | `90` | Idade máx. (s) da captura da SPTrans |
| `MAX_PHOTO_BYTES` | `2097152` | Tamanho máx. da foto (2 MiB) |
| `VALIDATION_BYPASS` | `false` | **Só dev.** `true` aceita qualquer trajeto (pula só o GPS) |
| `DISTANCIA_MEDIA_KM` | `7` | Distância estimada por trajeto |
| `FATOR_CO2_CARRO_KG_KM` | `0.171` | Emissão do carro (passageiro-km) |
| `FATOR_CO2_ONIBUS_KG_KM` | `0.089` | Emissão do ônibus (passageiro-km) |
| `PONTOS_BASE` | `10` | Pontos fixos por trajeto |
| `PONTOS_POR_KM` | `6` | Pontos por km |
| `TRAJETOS_POR_NIVEL` | `3` | Trajetos para subir de nível |
| `DESAFIO_SEMANAL_META` | `5` | Trajetos/semana para o desafio |
| `DESAFIO_SEMANAL_RECOMPENSA` | `150` | Bônus em Ecoa ao concluir |
| `IMAGE_ANALYSIS_ENABLED` | `true` | Liga a análise da foto (baixa o modelo no 1º uso) |
| `IMAGE_ANALYSIS_PROVIDER` | `local` | `local` \| `anthropic` \| `gemini` (só `local` implementado) |
| `IMAGE_ANALYSIS_MODEL` | `Xenova/clip-vit-base-patch32` | Modelo transformers.js |
| `IMAGE_ANALYSIS_MODE` | `blocking` | `blocking` recusa; `advisory` só registra |
| `IMAGE_ANALYSIS_MIN_CONFIDENCE` | `0.5` | Limiar de confiança para aprovar |
| `IMAGE_ANALYSIS_TIMEOUT_MS` | `10000` | Timeout da inferência |
| `IMAGE_ANALYSIS_FAIL_MODE` | `open` | Em erro: `open` aprova, `closed` rejeita |

---

## 5. Frontend

### Stack

React 19 + TypeScript · Vite 8 · React Router 7 · **CSS Modules + design tokens**
(`src/styles/tokens.css`) · `lucide-react` (ícones). Sem lib de estado global —
`Context` para o fluxo de validação e um hook `useApi` para buscar dados.

### Estrutura

```
frontend/src/
├─ main.tsx                bootstrap + <BrowserRouter>
├─ App.tsx                 rotas + <TrajetoProvider>
├─ styles/                 tokens.css (cores/espaçamento do Figma) + global.css
├─ types/                  tipos de domínio (Perfil, Carteira, Recompensa, …)
├─ lib/
│  ├─ api.ts               cliente HTTP do backend (fetch + tratamento de erro)
│  ├─ geo.ts               HTML5 Geolocation com tratamento de permissão/timeout
│  └─ imagem.ts            redimensiona/comprime a foto (arquivo ou frame de vídeo)
├─ hooks/useApi.ts         busca de dados com loading / erro / reload
├─ flows/trajeto/          Context: linha, posição, foto, resultado — entre as telas
├─ components/             AppLayout, BottomNav, CameraCapture, Button, StatCard,
│                          Stepper, ProgressBar, ScreenHeader, StatePanel
└─ pages/                  uma pasta por tela (.tsx + .module.css)
```

### Telas / rotas

| Rota | Tela |
| --- | --- |
| `/` | **Home** — botão de iniciar trajeto + resumo de impacto + desafio da semana |
| `/novo-trajeto` | Escolha de transporte + busca de linha (SPTrans) + captura de GPS |
| `/validar/foto` | **Câmera ao vivo** (`getUserMedia`) — sem upload da galeria no caminho normal |
| `/validar/revisao` | Revisão da foto + dados capturados |
| `/validar/processando` | Recaptura o GPS e envia tudo ao backend |
| `/validar/resultado` | Resultado — tela de sucesso (com recompensa) **ou** de falha (com o motivo) |
| `/impacto` | **Meu Impacto** — CO₂ acumulado, jornada, nível, conquistas |
| `/credito` | **Carteira Ecoa** — saldo, opções de resgate (com confirmação), histórico |

Trem e Metrô aparecem como _"em breve"_ — a API Olho Vivo só cobre ônibus.

### Captura da foto — câmera ao vivo

`components/CameraCapture` abre a câmera traseira (`facingMode: 'environment'`),
mostra o vídeo ao vivo com uma mira, e "Tirar foto" captura o _frame_ atual para
um JPEG comprimido (< 1,4 MB). **Não há upload da galeria no caminho normal** —
isso barra o ataque "baixei uma foto de ônibus e mandei". Se a câmera não estiver
disponível (permissão negada, sem hardware, navegador antigo, HTTP), cai para um
seletor de arquivo como alternativa.

> `getUserMedia` **exige HTTPS** (ou `localhost`). Ver seção 6.

### Variáveis de ambiente

Só uma: `VITE_API_URL` (padrão `/api` — o proxy do Vite resolve em dev).

---

## 6. Como rodar

### 6.1 Local (desenvolvimento)

Dois terminais:

```bash
# terminal 1
cd backend && npm install && cp .env.example .env   # preencha SPTRANS_API_KEY
npm run dev                                          # http://localhost:3333

# terminal 2
cd frontend && npm install && cp .env.example .env
npm run dev                                          # http://localhost:5173
```

O primeiro `npm run dev` do backend com `IMAGE_ANALYSIS_ENABLED=true` baixa o
modelo CLIP (~150 MB, cacheado). O `npm run dev` do backend reinicia sozinho ao
salvar arquivos **em `src/` ou no `.env`**.

### 6.2 Testar no celular na mesma Wi-Fi

Câmera e GPS só funcionam em HTTPS. Na mesma rede:

```bash
cd frontend && npm run dev:mobile      # Vite em HTTPS, escuta na rede local
```

Abra no celular a URL **Network** que o Vite imprime (`https://SEU_IP:5173`) e
aceite o aviso de certificado (autoassinado local).

### 6.3 Testar com outras pessoas (fora da sua rede) — túnel

Para amigos testarem pegando ônibus pela cidade, exponha o dev local com um
**túnel** (uma URL pública HTTPS temporária). `vite.config.ts` já libera os hosts
`*.trycloudflare.com` / `*.ngrok*`.

```bash
# instalar o cloudflared uma vez (Windows)
winget install --id Cloudflare.cloudflared

# 3 terminais rodando ao mesmo tempo:
cd backend  && npm run dev
cd frontend && npm run dev            # normal, NÃO o dev:mobile
cloudflared tunnel --url http://localhost:5173
```

O `cloudflared` imprime `https://palavras-aleatorias.trycloudflare.com` — mande
essa URL. Basta tunelar o frontend (5173); o proxy do Vite encaminha `/api` para
o backend na mesma máquina.

**Notas:** o PC precisa ficar ligado e sem suspender, com os 3 terminais abertos;
a URL muda toda vez que o `cloudflared` reinicia; todos compartilham o **mesmo
usuário demo** (pontos/carteira somam na mesma conta); o hot-reload pode não
chegar nos celulares — é só recarregar a página.

### 6.4 Testar o fluxo sem estar num ônibus

No `backend/.env`, `VALIDATION_BYPASS=true` **pula a checagem de GPS** (aceita
qualquer localização). O resto continua real — câmera, análise da foto, pontos,
CO₂, carteira. Volte para `false` no teste de campo e antes de entregar.

### 6.5 Deploy (para a apresentação da banca)

- **Frontend:** build estático (`npm run build` → `dist/`) em Vercel / Netlify /
  Cloudflare Pages. Definir `VITE_API_URL` para a URL pública do backend.
- **Backend:** Render / Railway / Fly / VPS — precisam rodar binário nativo
  (`onnxruntime-node` do CLIP). **Vercel/Netlify não servem o backend.** Definir
  `SPTRANS_API_KEY`, `NODE_ENV=production`, `CORS_ORIGIN` = URL do frontend.

---

## 7. Uso de Inteligência Artificial (para o entregável do Challenge)

| Item | Detalhe |
| --- | --- |
| **Ferramenta** | Modelo **CLIP** `Xenova/clip-vit-base-patch32` via `@huggingface/transformers`, rodando localmente no backend (open-source, sem API paga, sem enviar dados a terceiros). |
| **Etapa do trabalho** | Validação do trajeto — verificar automaticamente se a foto do check-in é o interior de um transporte público. |
| **Como é usado** | Classificação **zero-shot**: a imagem é comparada com listas de frases positivas/negativas (o "prompt"); somam-se os _scores_ das positivas e compara-se com um limiar de confiança. As frases estão em `backend/src/services/analiseImagem.js`. |
| **Da resposta do modelo** | Aproveita-se `confiança` (0–1) e o rótulo de maior score. Em modo `blocking`, confiança abaixo do limiar recusa o check-in; em `advisory`, só registra para calibração. |

Ferramentas de IA (ChatGPT / Claude / etc.) também foram usadas como apoio no
desenvolvimento — declarar conforme as regras da disciplina.

---

## 8. Limitações conhecidas

- **Distância do trajeto é estimada** (fixa em 7 km). CO₂ e pontos são proporcionais
  a essa estimativa. Evolução natural: check-in + check-out para medir a distância
  real por Haversine.
- **Foto de uma tela em fullscreen passa** na análise de imagem (o CLIP vê o
  conteúdo "ônibus", ~0,99, igual a uma foto real). A câmera ao vivo mitiga o
  upload de foto salva, mas não impede apontar a câmera para um monitor. A defesa
  principal contra fraude continua sendo **GPS + proximidade a um ônibus real**.
- **Um único usuário** (demo). Sem cadastro/login — todos que usam o mesmo backend
  compartilham pontos e carteira.
- **`npm audit` do backend** acusa _high_ em `sharp` e `adm-zip` (dependências
  transitivas do `onnxruntime-node`, sem correção _upstream_). Mitigado por: limite
  de 2 MiB na foto, allowlist de formato, e a análise só roda após o GPS passar.
- **SPTrans**: a API Olho Vivo cobre só ônibus (não CPTM/Metrô) e a posição dos
  veículos tem alguns segundos de atraso — daí a tolerância de 150 m.

---

## 9. Fases de desenvolvimento (definidas no Challenge)

| Fase | Escopo | Entregue |
| --- | --- | --- |
| **1** | Backend & proxy SPTrans — setup Node, autenticação, rotas seguras | ✅ |
| **2** | Frontend base — Vite + React, 8 telas responsivas a partir do Figma | ✅ |
| **3** | Lógica de validação — GPS + câmera integrados ao backend | ✅ |
| **4** | Gamificação — pontos, CO₂ evitado, nível, desafio, carteira/resgate | ✅ |
| **+** | Análise de conteúdo da foto, câmera ao vivo, guarda de precisão de GPS | ✅ |

### Versionamento

Branch por funcionalidade (`feature/…`, `fix/…`, `docs/…`), nunca commit direto na
`main`. Conventional Commits. Merge em `main` via Pull Request no GitHub
(PRs #1 a #6). Repositório: `github.com/challenge2026-Andres/UrbanLink`.

---

## 10. Roadmap / evoluções

- Check-in + check-out para distância e CO₂ reais.
- Cadastro/login e dados por usuário; ranking.
- Conversão de pontos em passagem de verdade (integração com bilhetagem / vouchers).
- Missões (ex.: "selfie no transporte") e comunidade.
- Detecção de _liveness_ / anti-_spoofing_ de foto-de-tela (camada extra).
- Trocar a estimativa de distância pelo traçado da linha (endpoints de trajeto/paradas
  da SPTrans).
