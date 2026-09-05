import { Router } from 'express';
import { resetarStore } from '../store/store.js';

export const devRouter = Router();

/**
 * POST /api/dev/reset
 * Zera os dados de gamificação (usuário demo, trajetos, carteira).
 * Só é montada fora de produção — ver app.js.
 */
devRouter.post('/reset', (_req, res) => {
  resetarStore();
  res.json({ ok: true });
});
