import 'dotenv/config';

/**
 * Lê e valida as variáveis de ambiente necessárias para o backend.
 *
 * Falha rápido (encerra o processo) se algo obrigatório estiver ausente,
 * evitando que o servidor suba num estado inválido.
 *
 * @returns {{
 *   port: number,
 *   nodeEnv: 'development' | 'production' | 'test',
 *   isProduction: boolean,
 *   sptransApiKey: string,
 *   sptransBaseUrl: string,
 *   corsOrigin: string
 * }}
 */
function loadEnv() {
  const {
    PORT = '3333',
    NODE_ENV = 'development',
    SPTRANS_API_KEY,
    SPTRANS_BASE_URL = 'https://api.olhovivo.sptrans.com.br/v2.1',
    CORS_ORIGIN = 'http://localhost:5173',
  } = process.env;

  const missing = [];
  if (!SPTRANS_API_KEY) missing.push('SPTRANS_API_KEY');

  if (missing.length > 0) {
    console.error(
      `[config] Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}.\n` +
        '        Copie backend/.env.example para backend/.env e preencha os valores.',
    );
    process.exit(1);
  }

  const port = Number.parseInt(PORT, 10);
  if (Number.isNaN(port)) {
    console.error(`[config] PORT inválida: "${PORT}"`);
    process.exit(1);
  }

  return {
    port,
    nodeEnv: NODE_ENV,
    isProduction: NODE_ENV === 'production',
    sptransApiKey: SPTRANS_API_KEY,
    sptransBaseUrl: SPTRANS_BASE_URL.replace(/\/$/, ''),
    corsOrigin: CORS_ORIGIN,
  };
}

export const env = loadEnv();
