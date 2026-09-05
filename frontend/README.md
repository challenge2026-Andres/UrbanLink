# UrbanLink — Frontend

App mobile-first em **React + Vite + TypeScript**. Fase 2: telas principais
navegáveis com dados mockados. A integração real (GPS, câmera, backend) entra na Fase 3.

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
| `npm run build` | Type-check + build de produção   |
| `npm run preview` | Serve o build local            |
| `npm run lint`  | oxlint                           |

## Telas (a partir do Figma)

| Rota                    | Tela                                            |
| ----------------------- | ----------------------------------------------- |
| `/`                     | Home — destaque para iniciar trajeto + impacto  |
| `/novo-trajeto`         | Escolha de transporte e linha                   |
| `/validar/foto`         | Captura da foto (passo 2)                       |
| `/validar/revisao`      | Revisão da foto e dos dados                     |
| `/validar/processando`  | Validação em andamento                          |
| `/validar/sucesso`      | Trajeto validado + crédito Ecoa                 |
| `/impacto`              | Meu Impacto — CO₂, jornada, nível, conquistas   |
| `/credito`              | Carteira Ecoa — saldo, resgates, histórico      |

Design de referência:
[Figma UrbanLink](https://www.figma.com/design/EOycJtgdHEyUoEpqisXzBD/UrbanLink).

## Estrutura

```
frontend/src/
├─ main.tsx                 # bootstrap + BrowserRouter
├─ App.tsx                  # rotas
├─ styles/                  # tokens.css + global.css
├─ types/                   # tipos de domínio
├─ data/mock.ts             # dados mockados da Fase 2
├─ components/               # AppLayout, BottomNav, Button, StatCard, Stepper, ...
└─ pages/                   # uma pasta por tela (.tsx + .module.css)
```
