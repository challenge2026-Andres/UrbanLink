import { Router } from 'express';
import { lerStore, resetarStore } from '../store/store.js';
import { env } from '../config/env.js';

export const devRouter = Router();

/**
 * POST /api/dev/reset
 * Zera os dados de gamificação (usuário demo, trajetos, carteira).
 * Só é montada fora de produção — ver app.js.
 */
devRouter.post('/reset', (_req, res) => {
  resetarStore();
  res.json({ ok: true });
});

/** Faixas de confiança para o histograma. */
const FAIXAS = [
  [0, 0.1],
  [0.1, 0.3],
  [0.3, 0.5],
  [0.5, 0.7],
  [0.7, 0.9],
  [0.9, 1.01],
];

/** @param {number[]} valores */
function resumo(valores) {
  if (valores.length === 0) return { n: 0 };
  const soma = valores.reduce((s, v) => s + v, 0);
  return {
    n: valores.length,
    min: Math.min(...valores),
    max: Math.max(...valores),
    media: Math.round((soma / valores.length) * 1000) / 1000,
  };
}

/**
 * GET /api/dev/analise-imagem
 * Resumo das análises de foto dos trajetos já validados — para calibrar o
 * limiar (`IMAGE_ANALYSIS_MIN_CONFIDENCE`) antes de ligar o modo blocking.
 *
 * Só reflete check-ins que foram validados (em modo advisory, todos ganham
 * `analiseFoto`; em blocking, fotos reprovadas não viram trajeto).
 */
devRouter.get('/analise-imagem', (_req, res) => {
  const { trajetos } = lerStore();
  const analises = trajetos.map((t) => t.analiseFoto).filter((a) => a != null);

  const aprovadas = analises.filter((a) => a.aprovada);
  const reprovadas = analises.filter((a) => !a.aprovada);

  const histograma = FAIXAS.map(([lo, hi]) => ({
    faixa: `${lo.toFixed(1)}–${hi >= 1 ? '1.0' : hi.toFixed(1)}`,
    aprovadas: aprovadas.filter((a) => a.confianca >= lo && a.confianca < hi).length,
    reprovadas: reprovadas.filter((a) => a.confianca >= lo && a.confianca < hi).length,
  }));

  const porRotulo = {};
  for (const a of analises) {
    const k = a.rotulo ?? 'sem rótulo';
    porRotulo[k] = (porRotulo[k] ?? 0) + 1;
  }

  res.json({
    config: {
      enabled: env.imageAnalysis.enabled,
      mode: env.imageAnalysis.mode,
      minConfidence: env.imageAnalysis.minConfidence,
    },
    total: analises.length,
    aprovadas: resumo(aprovadas.map((a) => a.confianca)),
    reprovadas: resumo(reprovadas.map((a) => a.confianca)),
    histogramaConfianca: histograma,
    porRotulo,
    // Sugestão de limiar: ponto médio entre a maior reprovada e a menor aprovada.
    sugestaoLimiar:
      aprovadas.length && reprovadas.length
        ? Math.round(
            ((Math.min(...aprovadas.map((a) => a.confianca)) +
              Math.max(...reprovadas.map((a) => a.confianca))) /
              2) *
              100,
          ) / 100
        : null,
  });
});
