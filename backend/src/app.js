import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { carteiraRouter } from './routes/carteira.js';
import { devRouter } from './routes/dev.js';
import { healthRouter } from './routes/health.js';
import { linhasRouter } from './routes/linhas.js';
import { perfilRouter } from './routes/perfil.js';
import { trajetosRouter } from './routes/trajetos.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

/**
 * Monta a aplicação Express com a stack de segurança e as rotas da API.
 * Separado de `server.js` para permitir testes de integração sem abrir porta.
 *
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  // Necessário para o express-rate-limit identificar o IP real atrás de proxy
  // (Render, Railway, etc.). Em dev com localhost é inofensivo.
  app.set('trust proxy', 1);

  // Headers de segurança.
  app.use(helmet());

  // CORS restrito à origem do frontend.
  app.use(cors({ origin: env.corsOrigin }));

  // Log de requisições.
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  // Rate limiting global: protege contra abuso e estoura de cota da SPTrans.
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'rate_limited', message: 'Muitas requisições. Aguarde um minuto.' },
    }),
  );

  const jsonPequeno = express.json({ limit: '10kb' });

  app.use('/api/health', healthRouter);
  app.use('/api/linhas', linhasRouter);
  app.use('/api/perfil', perfilRouter);
  app.use('/api/carteira', jsonPequeno, carteiraRouter);

  // A validação de trajeto recebe uma foto em base64; libera um corpo maior
  // apenas nesta rota.
  const fotoJsonLimit = Math.ceil((env.maxPhotoBytes * 1.4) / 1024) + 64;
  app.use('/api/trajetos', express.json({ limit: `${fotoJsonLimit}kb` }), trajetosRouter);

  // Utilidades de desenvolvimento (nunca em produção).
  if (!env.isProduction) {
    app.use('/api/dev', jsonPequeno, devRouter);
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
