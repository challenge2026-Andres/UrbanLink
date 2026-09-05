import { Router } from 'express';
import { estaAutenticado } from '../services/sptransClient.js';

export const healthRouter = Router();

/**
 * GET /api/health
 * Liveness check simples. Não chama a SPTrans para não gastar sessão;
 * apenas informa se já existe um cookie de sessão em memória.
 */
healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    sptransSessao: estaAutenticado() ? 'ativa' : 'nao-autenticado',
  });
});
