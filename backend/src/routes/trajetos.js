import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { inspecionarFoto } from '../utils/foto.js';
import { logger } from '../utils/logger.js';
import { validarPresencaTrajeto } from '../services/validacaoTrajeto.js';

export const trajetosRouter = Router();

/** Corpo da validação de trajeto: GPS do celular + linha + foto + horário. */
const validarBodySchema = z.object({
  codigoLinha: z
    .number({ required_error: 'codigoLinha é obrigatório.' })
    .int('codigoLinha deve ser inteiro.')
    .positive('codigoLinha deve ser positivo.'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
  capturadoEm: z
    .string()
    .datetime({ offset: true, message: 'capturadoEm deve ser uma data ISO.' }),
  // Tamanho em bytes é checado depois de decodificar; aqui só limita o payload cru.
  foto: z.string().min(1).max(Math.ceil(env.maxPhotoBytes * 1.4)),
});

/**
 * POST /api/trajetos/validar
 * Recebe a posição do celular, a linha declarada, a foto e o horário; compara
 * com a posição real dos veículos da linha (SPTrans) e responde se o check-in
 * é válido. A foto não é armazenada — apenas inspecionada e registrada em log.
 */
trajetosRouter.post(
  '/validar',
  asyncHandler(async (req, res) => {
    const body = validarBodySchema.parse(req.body);

    const foto = inspecionarFoto(body.foto, env.maxPhotoBytes);
    if (!foto.ok) {
      return res.status(400).json({ error: 'foto_invalida', message: foto.erro });
    }
    logger.info('[trajeto] foto recebida', {
      mime: foto.mime,
      bytes: foto.bytes,
      sha256: foto.sha256,
    });

    const resultado = await validarPresencaTrajeto({
      codigoLinha: body.codigoLinha,
      lat: body.lat,
      lng: body.lng,
      capturadoEm: body.capturadoEm,
    });

    res.json({
      ...resultado,
      foto: { recebida: true, bytes: foto.bytes, sha256: foto.sha256 },
    });
  }),
);
