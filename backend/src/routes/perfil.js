import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { montarPerfil } from '../services/perfil.js';

export const perfilRouter = Router();

/**
 * GET /api/perfil
 * Perfil consolidado do usuário: saldo, nível, impacto (trajetos, km, CO₂),
 * desafio da semana e conquistas.
 */
perfilRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(montarPerfil());
  }),
);
