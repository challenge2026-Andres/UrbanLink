import { createApp } from './app.js';
import { env } from './config/env.js';
import { aquecerAnaliseImagem } from './services/analiseImagem.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info('[server] backend no ar', {
    port: env.port,
    env: env.nodeEnv,
    sptransBaseUrl: env.sptransBaseUrl,
  });
  // Pré-carrega o modelo de análise de imagem em background (não bloqueia).
  void aquecerAnaliseImagem();
});

/** Encerramento gracioso. */
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    logger.info(`[server] recebido ${signal}, encerrando`);
    server.close(() => process.exit(0));
  });
}
