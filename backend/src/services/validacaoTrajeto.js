import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { distanciaMetros } from '../utils/geo.js';
import { posicaoPorLinha } from './sptransClient.js';

/**
 * Motivos possíveis para um trajeto NÃO ser validado.
 * `foto_rejeitada` é aplicado fora deste serviço (rota), pela análise de imagem.
 * @typedef {'sem_veiculos' | 'fora_do_raio' | 'posicao_desatualizada' | 'timestamp_invalido' | 'foto_rejeitada'} MotivoInvalido
 */

/** Tolerância máxima entre o horário informado pelo cliente e o do servidor. */
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * @typedef {object} ResultadoValidacao
 * @property {boolean} valido
 * @property {MotivoInvalido | null} motivo
 * @property {string} validadoEm            ISO do momento da validação.
 * @property {object} detalhes
 * @property {number} detalhes.raioToleranciaM
 * @property {number | null} detalhes.distanciaMetros    Distância ao veículo mais próximo.
 * @property {object | null} detalhes.veiculoMaisProximo {prefixo, lat, lng, capturadoEm}
 * @property {string | null} detalhes.horaConsultaSptrans
 * @property {number} detalhes.veiculosNaLinha
 */

/**
 * Valida a presença do usuário num trajeto comparando a posição do celular
 * com a posição em tempo real dos veículos da linha (API da SPTrans).
 *
 * Regras para um check-in ser válido:
 *  1. A linha precisa ter ao menos um veículo em operação.
 *  2. O celular precisa estar a no máximo `VALIDATION_RADIUS_M` do veículo mais próximo.
 *  3. A captura da SPTrans para esse veículo precisa ser recente
 *     (<= `SPTRANS_POSITION_MAX_AGE_S`), senão a comparação não é confiável.
 *  4. O horário informado pelo cliente não pode divergir muito do horário do servidor.
 *
 * @param {object} params
 * @param {number} params.codigoLinha  Código interno da linha (campo `cl` da busca).
 * @param {number} params.lat          Latitude do celular.
 * @param {number} params.lng          Longitude do celular.
 * @param {string} params.capturadoEm  ISO do momento em que o cliente capturou GPS/foto.
 * @returns {Promise<ResultadoValidacao>}
 */
export async function validarPresencaTrajeto({ codigoLinha, lat, lng, capturadoEm }) {
  const agora = Date.now();
  const validadoEm = new Date(agora).toISOString();

  // Atalho de desenvolvimento: considera qualquer trajeto válido (ver env.js).
  // Ainda tenta buscar a posição real para preencher os detalhes da tela.
  if (env.validationBypass) {
    const detalhes = await detalhesMelhorEsforco(codigoLinha, { lat, lng });
    logger.warn('[trajeto] validado via VALIDATION_BYPASS (dev)', { codigoLinha });
    return { valido: true, motivo: null, validadoEm, detalhes };
  }

  const skew = Math.abs(agora - new Date(capturadoEm).getTime());
  if (Number.isNaN(skew) || skew > MAX_CLOCK_SKEW_MS) {
    return {
      valido: false,
      motivo: 'timestamp_invalido',
      validadoEm,
      detalhes: baseDetalhes(),
    };
  }

  const posicao = await posicaoPorLinha(codigoLinha);
  const veiculos = Array.isArray(posicao?.vs) ? posicao.vs : [];

  if (veiculos.length === 0) {
    return {
      valido: false,
      motivo: 'sem_veiculos',
      validadoEm,
      detalhes: { ...baseDetalhes(), horaConsultaSptrans: posicao?.hr ?? null },
    };
  }

  const celular = { lat, lng };
  let maisProximo = null;
  for (const v of veiculos) {
    if (typeof v.py !== 'number' || typeof v.px !== 'number') continue;
    const distancia = distanciaMetros(celular, { lat: v.py, lng: v.px });
    if (!maisProximo || distancia < maisProximo.distancia) {
      maisProximo = {
        distancia,
        prefixo: v.p != null ? String(v.p) : null,
        lat: v.py,
        lng: v.px,
        capturadoEm: v.ta ?? null,
      };
    }
  }

  const detalhes = {
    raioToleranciaM: env.validationRadiusM,
    distanciaMetros: maisProximo?.distancia ?? null,
    veiculoMaisProximo: maisProximo
      ? {
          prefixo: maisProximo.prefixo,
          lat: maisProximo.lat,
          lng: maisProximo.lng,
          capturadoEm: maisProximo.capturadoEm,
        }
      : null,
    horaConsultaSptrans: posicao?.hr ?? null,
    veiculosNaLinha: veiculos.length,
  };

  if (!maisProximo || maisProximo.distancia > env.validationRadiusM) {
    return { valido: false, motivo: 'fora_do_raio', validadoEm, detalhes };
  }

  const capturaIdadeS = maisProximo.capturadoEm
    ? (agora - new Date(maisProximo.capturadoEm).getTime()) / 1000
    : Number.POSITIVE_INFINITY;

  if (!Number.isFinite(capturaIdadeS) || capturaIdadeS > env.sptransPositionMaxAgeS) {
    return { valido: false, motivo: 'posicao_desatualizada', validadoEm, detalhes };
  }

  logger.info('[trajeto] presença validada', {
    codigoLinha,
    distanciaMetros: maisProximo.distancia,
    prefixo: maisProximo.prefixo,
  });

  return { valido: true, motivo: null, validadoEm, detalhes };
}

/** @returns {ResultadoValidacao['detalhes']} */
function baseDetalhes() {
  return {
    raioToleranciaM: env.validationRadiusM,
    distanciaMetros: null,
    veiculoMaisProximo: null,
    horaConsultaSptrans: null,
    veiculosNaLinha: 0,
  };
}

/**
 * Busca a posição real dos veículos e monta os detalhes para exibição,
 * sem aplicar nenhuma regra de validação. Nunca lança — em erro devolve o base.
 * Usado apenas pelo bypass de desenvolvimento.
 *
 * @param {number} codigoLinha
 * @param {{ lat: number, lng: number }} celular
 * @returns {Promise<ResultadoValidacao['detalhes']>}
 */
async function detalhesMelhorEsforco(codigoLinha, celular) {
  try {
    const posicao = await posicaoPorLinha(codigoLinha);
    const veiculos = Array.isArray(posicao?.vs) ? posicao.vs : [];
    let maisProximo = null;
    for (const v of veiculos) {
      if (typeof v.py !== 'number' || typeof v.px !== 'number') continue;
      const distancia = distanciaMetros(celular, { lat: v.py, lng: v.px });
      if (!maisProximo || distancia < maisProximo.distancia) {
        maisProximo = { distancia, prefixo: v.p != null ? String(v.p) : null, lat: v.py, lng: v.px, capturadoEm: v.ta ?? null };
      }
    }
    return {
      raioToleranciaM: env.validationRadiusM,
      distanciaMetros: maisProximo?.distancia ?? null,
      veiculoMaisProximo: maisProximo
        ? { prefixo: maisProximo.prefixo, lat: maisProximo.lat, lng: maisProximo.lng, capturadoEm: maisProximo.capturadoEm }
        : null,
      horaConsultaSptrans: posicao?.hr ?? null,
      veiculosNaLinha: veiculos.length,
    };
  } catch {
    return baseDetalhes();
  }
}
