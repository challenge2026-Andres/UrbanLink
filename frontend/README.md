# UrbanLink — Frontend

App mobile-first em **React + Vite + TypeScript**. O fluxo "Novo trajeto → Validar
trajeto" usa GPS (HTML5 Geolocation), câmera e o backend de verdade; as telas de
impacto e carteira ainda usam dados mockados (viram reais na Fase 4).

## Stack

- React 19 + TypeScript
- Vite 8
- React Router 7 (navegação)
- CSS Modules + design tokens (`src/styles/tokens.css`)
- lucide-react (ícones)

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # no Windows: copy .env.example .env
npm run dev
```

App em `http://localhost:5173`. Em dev, o Vite faz proxy de `/api` para
`http://localhost:3333` (o backend) — ver `vite.config.ts`.

| Script          | Ação                             |
| --------------- | -------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento      |
| `npm run dev:mobile` | Dev em HTTPS na rede local (testar no celular) |
| `npm run build` | Type-check + build de produção   |
| `npm run preview` | Serve o build local            |
| `npm run lint`  | oxlint                           |

## Testar no celular

GPS e câmera só funcionam em `localhost` ou HTTPS. Para testar num aparelho:

1. Celular e PC na **mesma rede Wi-Fi**.
2. Rode o backend (`cd backend && npm run dev`) e, em outro terminal,
   `cd frontend && npm run dev:mobile`.
3. Abra no celular a URL **Network** que o Vite imprime
   (ex.: `https://192.168.1.11:5173`) e aceite o aviso de certificado
   (é um certificado local autoassinado).

Para ver a **tela de sucesso sem estar dentro de um ônibus**, ligue o bypass de
dev no backend: `VALIDATION_BYPASS=true` no `backend/.env` (nunca funciona em
produção). Com ele, qualquer validação é aceita.

## Telas (a partir do Figma)

| Rota                    | Tela                                            |
| ----------------------- | ----------------------------------------------- |
| `/`                     | Home — destaque para iniciar trajeto + impacto  |
| `/novo-trajeto`         | Transporte + busca de linha (SPTrans) + GPS      |
| `/validar/foto`         | Captura da foto pela câmera do dispositivo       |
| `/validar/revisao`      | Revisão da foto e dos dados capturados           |
| `/validar/processando`  | Envia GPS + foto + horário ao backend            |
| `/validar/resultado`    | Resultado da validação (sucesso ou falha)        |
| `/impacto`              | Meu Impacto — CO₂, jornada, nível, conquistas   |
| `/credito`              | Carteira Ecoa — saldo, resgates, histórico      |

O estado do fluxo (linha, posição, foto, resultado) vive num contexto
(`src/flows/trajeto/`) compartilhado entre as telas.

Design de referência:
[Figma UrbanLink](https://www.figma.com/design/EOycJtgdHEyUoEpqisXzBD/UrbanLink).

## Estrutura

```
frontend/src/
├─ main.tsx                 # bootstrap + BrowserRouter
├─ App.tsx                  # rotas + <TrajetoProvider>
├─ styles/                  # tokens.css + global.css
├─ types/                   # tipos de domínio
├─ data/mock.ts             # dados mockados (telas de impacto/carteira)
├─ lib/                     # api.ts (backend), geo.ts (GPS), imagem.ts (foto)
├─ flows/trajeto/           # contexto do fluxo de validação
├─ components/              # AppLayout, BottomNav, Button, StatCard, Stepper, ...
└─ pages/                   # uma pasta por tela (.tsx + .module.css)
```
