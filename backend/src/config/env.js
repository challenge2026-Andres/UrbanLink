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
 *   validationBypass: boolean,
 *   gamificacao: {
 *     distanciaMediaKm: number,
 *     fatorCo2CarroKgKm: number,
 *     fatorCo2OnibusKgKm: number,
 *     pontosBase: number,
 *     pontosPorKm: number,
 *     trajetosPorNivel: number,
 *     desafioSemanalMeta: number,
 *     desafioSemanalRecompensa: number
 *   },
 *   imageAnalysis: {
 *     enabled: boolean,
 *     provider: 'local' | 'anthropic' | 'gemini',
 *     model: string,
 *     mode: 'advisory' | 'blocking',
 *     minConfidence: number,
 *     timeoutMs: number,
 *     failMode: 'open' | 'closed'
 *   }
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
    // Gamificação (Fase 4)
    DISTANCIA_MEDIA_KM = '7',
    FATOR_CO2_CARRO_KG_KM = '0.171',
    FATOR_CO2_ONIBUS_KG_KM = '0.089',
    PONTOS_BASE = '10',
    PONTOS_POR_KM = '6',
    TRAJETOS_POR_NIVEL = '3',
    DESAFIO_SEMANAL_META = '5',
    DESAFIO_SEMANAL_RECOMPENSA = '150',
    // Análise de conteúdo da foto
    IMAGE_ANALYSIS_ENABLED = 'false',
    IMAGE_ANALYSIS_PROVIDER = 'local',
    IMAGE_ANALYSIS_MODEL = 'Xenova/clip-vit-base-patch32',
    IMAGE_ANALYSIS_MODE = 'advisory',
    IMAGE_ANALYSIS_MIN_CONFIDENCE = '0.5',
    IMAGE_ANALYSIS_TIMEOUT_MS = '10000',
    IMAGE_ANALYSIS_FAIL_MODE = 'open',
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

  /**
   * @param {string} value
   * @param {string} name
   * @returns {number}
   */
  const toPositiveNumber = (value, name) => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      console.error(`[config] ${name} inválida: "${value}" (esperado número positivo).`);
      process.exit(1);
    }
    return parsed;
  };

  /**
   * @template {string} T
   * @param {string} value
   * @param {string} name
   * @param {readonly T[]} permitidos
   * @returns {T}
   */
  const toEnum = (value, name, permitidos) => {
    if (!permitidos.includes(/** @type {T} */ (value))) {
      console.error(`[config] ${name} inválida: "${value}" (esperado: ${permitidos.join(' | ')}).`);
      process.exit(1);
    }
    return /** @type {T} */ (value);
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
    gamificacao: {
      distanciaMediaKm: toPositiveNumber(DISTANCIA_MEDIA_KM, 'DISTANCIA_MEDIA_KM'),
      fatorCo2CarroKgKm: toPositiveNumber(FATOR_CO2_CARRO_KG_KM, 'FATOR_CO2_CARRO_KG_KM'),
      fatorCo2OnibusKgKm: toPositiveNumber(FATOR_CO2_ONIBUS_KG_KM, 'FATOR_CO2_ONIBUS_KG_KM'),
      pontosBase: toPositiveInt(PONTOS_BASE, 'PONTOS_BASE'),
      pontosPorKm: toPositiveNumber(PONTOS_POR_KM, 'PONTOS_POR_KM'),
      trajetosPorNivel: toPositiveInt(TRAJETOS_POR_NIVEL, 'TRAJETOS_POR_NIVEL'),
      desafioSemanalMeta: toPositiveInt(DESAFIO_SEMANAL_META, 'DESAFIO_SEMANAL_META'),
      desafioSemanalRecompensa: toPositiveInt(
        DESAFIO_SEMANAL_RECOMPENSA,
        'DESAFIO_SEMANAL_RECOMPENSA',
      ),
    },
    imageAnalysis: {
      enabled: IMAGE_ANALYSIS_ENABLED === 'true',
      provider: toEnum(IMAGE_ANALYSIS_PROVIDER, 'IMAGE_ANALYSIS_PROVIDER', [
        'local',
        'anthropic',
        'gemini',
      ]),
      model: IMAGE_ANALYSIS_MODEL,
      mode: toEnum(IMAGE_ANALYSIS_MODE, 'IMAGE_ANALYSIS_MODE', ['advisory', 'blocking']),
      minConfidence: toPositiveNumber(IMAGE_ANALYSIS_MIN_CONFIDENCE, 'IMAGE_ANALYSIS_MIN_CONFIDENCE'),
      timeoutMs: toPositiveInt(IMAGE_ANALYSIS_TIMEOUT_MS, 'IMAGE_ANALYSIS_TIMEOUT_MS'),
      failMode: toEnum(IMAGE_ANALYSIS_FAIL_MODE, 'IMAGE_ANALYSIS_FAIL_MODE', ['open', 'closed']),
    },
  };
}

export const env = loadEnv();
