# Projeto: EcoTransit (FIAP Challenge)

## Objetivo
Gamificar o uso de transporte público em São Paulo para reduzir emissões de CO2. Usuários fazem check-in (Foto + GPS) em ônibus, o sistema valida a presença usando a API da SPTrans e concede pontos.

## Stack Tecnológica
- **Backend:** Node.js (Express) para gerenciar a API da SPTrans.
- **Frontend:** React com Vite (Mobile-first).
- **Features Nativas:** API de Geolocalização (HTML5) e Câmera.

## Regras Estritas de Operação (Para a IA)
1. **Controle de Versão (Git Workflow):** NUNCA faça commits direto na branch `main`. 
   - Crie branches semânticas para cada funcionalidade (ex: `feature/setup-node`, `feature/sptrans-auth`, `fix/gps-bug`).
   - Use **Conventional Commits** (ex: `feat: adiciona rota de validacao sptrans`, `docs: atualiza readme`).
   - Faça pequenos commits lógicos durante as fases, não um commit gigante no final.
2. **Documentação Rigorosa:** Todo código complexo, especialmente as chamadas para a API da SPTrans e lógica de cálculo de CO2, deve ser documentado (ex: JSDoc). Mantenha o `README.md` do projeto sempre atualizado com as instruções de como rodar o app.
3. **Segurança de API:** A API Key da SPTrans NUNCA deve ser exposta no frontend.
4. **Fases de Execução:**
   - **Fase 1: Backend & Proxy SPTrans.** Setup do Node.js e rotas seguras.
   - **Fase 2: Frontend Base (Vite + React).** Telas principais responsivas (Figma).
   - **Fase 3: Lógica de Validação.** Integração de GPS e Câmera com o Backend.
   - **Fase 4: Gamificação.** Cálculo de pontos, CO2 evitado e recompensas.