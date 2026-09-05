import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { montarCarteira } from '../services/perfil.js';
import { resgatarEcoa } from '../services/recompensas.js';

export const carteiraRouter = Router();

/**
 * GET /api/carteira
 * Saldo Ecoa, opções de resgate e histórico de lançamentos.
 */
carteiraRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(montarCarteira());
  }),
);

const resgatarBodySchema = z.object({
  opcaoId: z.string().trim().min(1, 'opcaoId é obrigatório.'),
});

/**
 * POST /api/carteira/resgatar
 * Troca créditos Ecoa por uma opção do catálogo (passagem, cashback, descontos).
 */
carteiraRouter.post(
  '/resgatar',
  asyncHandler(async (req, res) => {
    const { opcaoId } = resgatarBodySchema.parse(req.body);
    const resultado = resgatarEcoa(opcaoId);

    if (!resultado.ok) {
      return res.status(resultado.status).json({ error: 'resgate_falhou', message: resultado.erro });
    }

    res.json({ saldo: resultado.saldo, resgate: resultado.opcao });
  }),
);
