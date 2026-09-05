import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { inspecionarFoto } from '../utils/foto.js';
import { logger } from '../utils/logger.js';
import { analisarFotoTransporte } from '../services/analiseImagem.js';
import { validarPresencaTrajeto } from '../services/validacaoTrajeto.js';
import { registrarTrajetoValidado } from '../services/recompensas.js';

export const trajetosRouter = Router();

/** Corpo da validação de trajeto: GPS do celular + linha + foto + horário. */
const validarBodySchema = z.object({
  codigoLinha: z
    .number({ required_error: 'codigoLinha é obrigatório.' })
    .int('codigoLinha deve ser inteiro.')
    .positive('codigoLinha deve ser positivo.'),
  linha: z.object({
    lt: z.string().trim().min(1).max(20),
    sl: z.union([z.literal(1), z.literal(2)]),
    tp: z.string().trim().min(1).max(120),
    ts: z.string().trim().min(1).max(120),
  }),
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
 * com a posição real dos veículos da linha (SPTrans). Se válido, registra o
 * trajeto e credita pontos + Ecoa. A foto não é armazenada — apenas inspecionada.
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

    // Análise de conteúdo da foto — só roda se o GPS já passou (economiza CPU)
    // e nunca no bypass de dev.
    let analise = null;
    if (resultado.valido) {
      analise = await analisarFotoTransporte(body.foto);
      if (analise.executada) {
        logger.info('[trajeto] analise de foto', {
          aprovada: analise.aprovada,
          confianca: analise.confianca,
          rotulo: analise.rotulo,
          modo: env.imageAnalysis.mode,
        });
      }
      // Em modo "blocking", foto reprovada invalida o check-in.
      if (env.imageAnalysis.mode === 'blocking' && analise.executada && !analise.aprovada) {
        resultado.valido = false;
        resultado.motivo = 'foto_rejeitada';
      }
    }

    let recompensa = null;
    let desafioConcluido = false;
    if (resultado.valido) {
      const registro = registrarTrajetoValidado({
        codigoLinha: body.codigoLinha,
        linha: body.linha,
        embarque: { lat: body.lat, lng: body.lng, em: body.capturadoEm },
        detalhes: resultado.detalhes,
        fotoSha256: foto.sha256,
        analiseFoto: analise?.executada
          ? { aprovada: analise.aprovada, confianca: analise.confianca, rotulo: analise.rotulo }
          : null,
        validadoEm: resultado.validadoEm,
      });
      recompensa = registro.recompensa;
      desafioConcluido = registro.desafioConcluido;
    }

    res.json({
      ...resultado,
      recompensa,
      desafioConcluido,
      foto: {
        recebida: true,
        bytes: foto.bytes,
        sha256: foto.sha256,
        analise: analise
          ? {
              executada: analise.executada,
              aprovada: analise.aprovada,
              confianca: analise.confianca,
              rotulo: analise.rotulo,
              modo: env.imageAnalysis.mode,
              status: analise.status,
            }
          : null,
      },
    });
  }),
);
