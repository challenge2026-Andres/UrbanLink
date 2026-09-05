import { ZodError } from 'zod';
import { SptransError } from '../services/sptransClient.js';
import { logger } from '../utils/logger.js';

/**
 * Rota não encontrada -> 404 padronizado.
 * @type {import('express').RequestHandler}
 */
export function notFound(req, res) {
  res.status(404).json({ error: 'not_found', message: `Rota ${req.method} ${req.path} não existe.` });
}

/**
 * Handler de erros central. Converte erros conhecidos em respostas JSON
 * consistentes e nunca vaza stack trace ou detalhes internos ao cliente.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars -- Express identifica o handler pela aridade (4 args).
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Parâmetros inválidos.',
      details: err.issues.map((i) => ({ campo: i.path.join('.'), problema: i.message })),
    });
  }

  // Erros do body-parser (JSON malformado, corpo grande demais).
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'payload_too_large', message: 'Corpo da requisição grande demais.' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid_json', message: 'JSON inválido no corpo da requisição.' });
  }

  if (err instanceof SptransError) {
    logger.error(err.message, { ...err.meta });
    return res.status(err.httpStatus).json({
      error: 'sptrans_upstream_error',
      message: 'Falha ao consultar a API da SPTrans. Tente novamente em instantes.',
    });
  }

  logger.error('Erro não tratado', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });
  res.status(500).json({ error: 'internal_error', message: 'Erro interno no servidor.' });
}
