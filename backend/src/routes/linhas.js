import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buscarLinhas, posicaoPorLinha } from '../services/sptransClient.js';

export const linhasRouter = Router();

/** Query da busca de linhas: termo obrigatório, 1..50 chars, sanitizado. */
const buscarQuerySchema = z.object({
  termosBusca: z
    .string({ required_error: 'termosBusca é obrigatório.' })
    .trim()
    .min(1, 'termosBusca não pode ser vazio.')
    .max(50, 'termosBusca é longo demais.')
    .regex(/^[\p{L}\p{N}\s.\-/]+$/u, 'termosBusca contém caracteres inválidos.'),
});

/** Param de código de linha: inteiro positivo. */
const codigoLinhaParamSchema = z.object({
  codigoLinha: z.coerce
    .number({ invalid_type_error: 'codigoLinha deve ser numérico.' })
    .int('codigoLinha deve ser inteiro.')
    .positive('codigoLinha deve ser positivo.'),
});

/**
 * GET /api/linhas/buscar?termosBusca=8000
 * Proxy de `/Linha/Buscar` da SPTrans. Usado pelo frontend para o usuário
 * escolher a linha em que está fazendo check-in.
 */
linhasRouter.get(
  '/buscar',
  asyncHandler(async (req, res) => {
    const { termosBusca } = buscarQuerySchema.parse(req.query);
    const linhas = await buscarLinhas(termosBusca);
    res.json({ termosBusca, total: Array.isArray(linhas) ? linhas.length : 0, linhas });
  }),
);

/**
 * GET /api/linhas/:codigoLinha/posicoes
 * Proxy de `/Posicao/Linha` da SPTrans. Retorna a posição em tempo real dos
 * veículos da linha — base para a validação de presença (Fase 3).
 */
linhasRouter.get(
  '/:codigoLinha/posicoes',
  asyncHandler(async (req, res) => {
    const { codigoLinha } = codigoLinhaParamSchema.parse(req.params);
    const posicao = await posicaoPorLinha(codigoLinha);
    res.json(posicao);
  }),
);
