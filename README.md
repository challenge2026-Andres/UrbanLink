# UrbanLink

Gamificação do transporte público de São Paulo para reduzir emissões de CO₂.
O usuário faz check-in (foto + GPS) no ônibus, o sistema valida a presença
cruzando a localização do celular com a posição real dos veículos na
**API Olho Vivo da SPTrans**, e concede pontos. Os pontos evoluem para
recompensas — incluindo crédito de transporte público.

Challenge FIAP + SoulUp — 2026, 1º semestre.

📄 **Documentação completa:** [DOCUMENTACAO.md](DOCUMENTACAO.md) — arquitetura,
endpoints, metodologia (CO₂, pontos, análise de imagem), como testar com outras
pessoas, deploy e limitações.

## Arquitetura

Monorepo simples, duas aplicações independentes:

```
UrbanLink/
├─ backend/         # Node.js + Express — proxy seguro da API da SPTrans
├─ frontend/        # React + Vite (mobile-first)
├─ CHALLENGE.md     # spec original (arquitetura e regras de operação)
├─ DOCUMENTACAO.md  # documentação completa do projeto
└─ README.md
```

- **Backend:** guarda a API Key da SPTrans (nunca exposta ao frontend), autentica,
  mantém a sessão e expõe rotas REST enxutas. Ver [backend/README.md](backend/README.md).
- **Frontend:** captura GPS (HTML5 Geolocation) e foto (câmera), consome o backend.

## Como rodar

### Backend

```bash
cd backend
npm install
cp .env.example .env      # preencha SPTRANS_API_KEY
npm run dev
```

Backend em `http://localhost:3333`. Detalhes e endpoints em
[backend/README.md](backend/README.md).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App em `http://localhost:5173`. O Vite faz proxy de `/api` para o backend em dev.
Detalhes em [frontend/README.md](frontend/README.md).

