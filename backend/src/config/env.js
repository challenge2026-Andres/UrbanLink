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
 *   corsOrigin: string,
 *   validationRadiusM: number,
 *   sptransPositionMaxAgeS: number,
 *   maxPhotoBytes: number,
 *   validationBypass: boolean
 * }}
 */
function loadEnv() {
  const {
    PORT = '3333',
    NODE_ENV = 'development',
    SPTRANS_API_KEY,
    SPTRANS_BASE_URL = 'https://api.olhovivo.sptrans.com.br/v2.1',
    CORS_ORIGIN = 'http://localhost:5173',
    VALIDATION_RADIUS_M = '150',
    SPTRANS_POSITION_MAX_AGE_S = '90',
    MAX_PHOTO_BYTES = '2097152',
    VALIDATION_BYPASS = 'false',
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

  /**
   * @param {string} value
   * @param {string} name
   * @returns {number}
   */
  const toPositiveInt = (value, name) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      console.error(`[config] ${name} inválida: "${value}" (esperado inteiro positivo).`);
      process.exit(1);
    }
    return parsed;
  };

  // Bypass da validação de presença: só para testar o fluxo em desenvolvimento.
  // NUNCA tem efeito em produção, mesmo se a variável estiver setada.
  const validationBypass = VALIDATION_BYPASS === 'true' && NODE_ENV !== 'production';
  if (validationBypass) {
    console.warn(
      '[config] AVISO: VALIDATION_BYPASS ativo — todo trajeto será considerado válido. Apenas para dev.',
    );
  }

  return {
    port: toPositiveInt(PORT, 'PORT'),
    nodeEnv: NODE_ENV,
    isProduction: NODE_ENV === 'production',
    sptransApiKey: SPTRANS_API_KEY,
    sptransBaseUrl: SPTRANS_BASE_URL.replace(/\/$/, ''),
    corsOrigin: CORS_ORIGIN,
    validationRadiusM: toPositiveInt(VALIDATION_RADIUS_M, 'VALIDATION_RADIUS_M'),
    sptransPositionMaxAgeS: toPositiveInt(SPTRANS_POSITION_MAX_AGE_S, 'SPTRANS_POSITION_MAX_AGE_S'),
    maxPhotoBytes: toPositiveInt(MAX_PHOTO_BYTES, 'MAX_PHOTO_BYTES'),
    validationBypass,
  };
}

export const env = loadEnv();
