import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Análise de conteúdo da foto do check-in: verifica se a imagem é mesmo o
 * interior de um transporte público.
 *
 * ## Como funciona (provider `local`)
 * Usa classificação **zero-shot** de imagem com CLIP (`@huggingface/transformers`),
 * rodando no próprio backend — a foto nunca sai do servidor.
 *
 * O CLIP coloca imagem e texto no mesmo espaço vetorial. Damos a ele a foto + uma
 * lista de descrições candidatas (umas "positivas" = interior de transporte, outras
 * "negativas" = casa, rua, selfie...). Ele devolve um score por descrição (somam 1).
 * Somamos os scores das positivas: se passar do limiar, a foto é aprovada.
 *
 * As descrições estão em inglês porque o CLIP é muito mais forte em EN; só o rótulo
 * final exibido ao usuário é em português.
 */

/** @typedef {{ texto: string, positivo: boolean, rotulo: string }} Rotulo */

/** @type {Rotulo[]} */
const ROTULOS = [
  // Positivos — interior de transporte público
  { texto: 'the inside of a city bus with passenger seats and grab handrails', positivo: true, rotulo: 'interior de ônibus' },
  { texto: 'the interior of a public transit vehicle with an aisle and windows', positivo: true, rotulo: 'interior de transporte público' },
  { texto: 'inside a subway metro train car with seats and poles', positivo: true, rotulo: 'interior de metrô' },
  { texto: 'inside a commuter train carriage', positivo: true, rotulo: 'interior de trem' },
  { texto: 'passengers standing and sitting inside a bus', positivo: true, rotulo: 'passageiros dentro de um ônibus' },
  // Negativos — não é
  { texto: 'a house or apartment window seen from inside a room', positivo: false, rotulo: 'janela de casa' },
  { texto: 'the outside facade of a residential building', positivo: false, rotulo: 'fachada de prédio' },
  { texto: 'an outdoor street with cars and buildings', positivo: false, rotulo: 'rua' },
  { texto: "a close-up selfie of a person's face", positivo: false, rotulo: 'selfie' },
  { texto: 'a screen of a phone, computer or television', positivo: false, rotulo: 'tela' },
  { texto: 'the inside of a private car with a steering wheel and dashboard', positivo: false, rotulo: 'interior de carro' },
  { texto: 'an indoor room like an office, store or home', positivo: false, rotulo: 'ambiente fechado' },
  { texto: 'the outside exterior of a bus or train', positivo: false, rotulo: 'exterior de veículo' },
  { texto: 'food, an animal, a document or a random object', positivo: false, rotulo: 'objeto ou outro' },
];

const TEXTOS = ROTULOS.map((r) => r.texto);

/**
 * @typedef {object} ResultadoAnalise
 * @property {boolean} executada   Se a análise chegou a rodar.
 * @property {boolean} aprovada
 * @property {number} confianca    Soma dos scores dos rótulos positivos (0..1).
 * @property {string | null} rotulo  Rótulo de maior score, em português.
 * @property {'ok' | 'indisponivel' | 'desligada'} status
 */

/** @returns {ResultadoAnalise} */
const desligada = () => ({ executada: false, aprovada: true, confianca: 0, rotulo: null, status: 'desligada' });

/** Aplica o `failMode` quando a análise não pôde rodar. @returns {ResultadoAnalise} */
const indisponivel = () => ({
  executada: false,
  aprovada: env.imageAnalysis.failMode === 'open',
  confianca: 0,
  rotulo: null,
  status: 'indisponivel',
});

/** Pipeline do transformers.js, carregada uma única vez. @type {Promise<Function> | null} */
let pipelinePromise = null;

/** @type {typeof import('@huggingface/transformers').RawImage | null} */
let RawImageRef = null;

async function getPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline, RawImage } = await import('@huggingface/transformers');
      RawImageRef = RawImage;
      logger.info('[analiseImagem] carregando modelo', { model: env.imageAnalysis.model });
      const pipe = await pipeline('zero-shot-image-classification', env.imageAnalysis.model);
      logger.info('[analiseImagem] modelo pronto');
      return pipe;
    })().catch((err) => {
      pipelinePromise = null; // permite nova tentativa depois
      throw err;
    });
  }
  return pipelinePromise;
}

/**
 * Converte o data URL base64 em RawImage (decodifica os bytes localmente).
 * @param {string} dataUrl
 */
async function lerImagem(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const buffer = Buffer.from(base64, 'base64');
  return RawImageRef.fromBlob(new Blob([buffer]));
}

/**
 * Classifica a foto contra os rótulos e decide se é interior de transporte.
 * @param {string} dataUrl
 * @returns {Promise<ResultadoAnalise>}
 */
async function analisarLocal(dataUrl) {
  const pipe = await getPipeline();
  const imagem = await lerImagem(dataUrl);

  const inferir = pipe(imagem, TEXTOS, { hypothesis_template: '{}' });
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout na inferência')), env.imageAnalysis.timeoutMs),
  );
  /** @type {Array<{ label: string, score: number }>} */
  const saida = await Promise.race([inferir, timeout]);

  const porTexto = new Map(saida.map((s) => [s.label, s.score]));
  let confianca = 0;
  let melhor = ROTULOS[0];
  let melhorScore = -1;
  for (const r of ROTULOS) {
    const score = porTexto.get(r.texto) ?? 0;
    if (r.positivo) confianca += score;
    if (score > melhorScore) {
      melhorScore = score;
      melhor = r;
    }
  }

  const aprovada = confianca >= env.imageAnalysis.minConfidence;
  return {
    executada: true,
    aprovada,
    confianca: Math.round(confianca * 1000) / 1000,
    rotulo: melhor.rotulo,
    status: 'ok',
  };
}

/**
 * Analisa a foto de um check-in. Nunca lança — em erro aplica o `failMode`.
 * @param {string} dataUrl  data URL base64 da foto.
 * @returns {Promise<ResultadoAnalise>}
 */
export async function analisarFotoTransporte(dataUrl) {
  if (!env.imageAnalysis.enabled) return desligada();

  try {
    switch (env.imageAnalysis.provider) {
      case 'local':
        return await analisarLocal(dataUrl);
      default:
        throw new Error(`provider "${env.imageAnalysis.provider}" ainda não implementado`);
    }
  } catch (err) {
    logger.error('[analiseImagem] falha na análise', { message: err.message });
    return indisponivel();
  }
}

/**
 * Pré-carrega o modelo no boot do servidor (não bloqueia o listen).
 * @returns {Promise<void>}
 */
export async function aquecerAnaliseImagem() {
  if (!env.imageAnalysis.enabled || env.imageAnalysis.provider !== 'local') return;
  try {
    await getPipeline();
  } catch (err) {
    logger.warn('[analiseImagem] não foi possível pré-carregar o modelo', { message: err.message });
  }
}
