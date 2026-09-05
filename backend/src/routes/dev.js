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
  if (valores.length === 0) return { n: 0, min: null, max: null, media: null };
  const soma = valores.reduce((s, v) => s + v, 0);
  return {
    n: valores.length,
    min: Math.min(...valores),
    max: Math.max(...valores),
    media: Math.round((soma / valores.length) * 1000) / 1000,
  };
}

/** Calcula o resumo das análises de foto a partir do store. */
function calcularResumo() {
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

  const sugestaoLimiar =
    aprovadas.length && reprovadas.length
      ? Math.round(
          ((Math.min(...aprovadas.map((a) => a.confianca)) +
            Math.max(...reprovadas.map((a) => a.confianca))) /
            2) *
            100,
        ) / 100
      : null;

  return {
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
    sugestaoLimiar,
  };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const pct = (n) => Math.round(n * 100);

/** Renderiza o resumo como uma página HTML simples de calibração. */
function renderHtml(r) {
  const maxBar = Math.max(1, ...r.histogramaConfianca.flatMap((h) => [h.aprovadas, h.reprovadas]));
  const linhas = r.histogramaConfianca
    .map((h) => {
      const a = (h.aprovadas / maxBar) * 100;
      const rep = (h.reprovadas / maxBar) * 100;
      return `<tr>
        <td class="faixa">${h.faixa}</td>
        <td class="bar"><span class="ap" style="width:${a}%"></span>${h.aprovadas || ''}</td>
        <td class="bar"><span class="re" style="width:${rep}%"></span>${h.reprovadas || ''}</td>
      </tr>`;
    })
    .join('');
  const rotulos = Object.entries(r.porRotulo)
    .sort((x, y) => y[1] - x[1])
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`)
    .join('');

  const g = (o) =>
    o.n === 0 ? '—' : `n=${o.n} · média ${o.media} · faixa ${o.min}–${o.max}`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="10">
<title>Análise de imagem — calibração</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 15px/1.5 system-ui, sans-serif; margin: 0; padding: 20px; max-width: 560px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { color: #888; font-size: 13px; margin-bottom: 20px; }
  .card { border: 1px solid #8884; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; }
  .card h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #888; margin: 0 0 6px; }
  .big { font-size: 28px; font-weight: 700; }
  .ap-txt { color: #1a9d5a; } .re-txt { color: #d64545; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 6px; font-size: 13px; }
  .faixa { white-space: nowrap; color: #888; width: 64px; }
  .bar { position: relative; }
  .bar span { position: absolute; left: 6px; top: 6px; bottom: 6px; border-radius: 4px; opacity: .35; }
  .bar .ap { background: #1a9d5a; } .bar .re { background: #d64545; }
  code { background: #8882; padding: 1px 5px; border-radius: 4px; }
</style></head><body>
<h1>Análise de imagem — calibração</h1>
<p class="sub">Atualiza a cada 10 s · ${r.total} check-in(s) validado(s) com análise</p>

<div class="card">
  <h2>Configuração atual</h2>
  <code>enabled=${r.config.enabled}</code> <code>mode=${r.config.mode}</code>
  <code>minConfidence=${r.config.minConfidence}</code>
</div>

<div class="card">
  <h2>Limiar sugerido</h2>
  <div class="big">${r.sugestaoLimiar ?? '—'}</div>
  <p class="sub" style="margin:4px 0 0">
    Ponto médio entre a maior confiança reprovada e a menor aprovada.
    ${r.sugestaoLimiar ? `Ajuste <code>IMAGE_ANALYSIS_MIN_CONFIDENCE</code> perto disso.` : 'Precisa de pelo menos uma aprovada e uma reprovada.'}
  </p>
</div>

<div class="card">
  <h2>Grupos</h2>
  <p><span class="ap-txt">● Aprovadas</span> — ${g(r.aprovadas)}</p>
  <p><span class="re-txt">● Reprovadas</span> — ${g(r.reprovadas)}</p>
</div>

<div class="card">
  <h2>Histograma de confiança</h2>
  <table><tbody>
    <tr><td class="faixa"></td><td class="ap-txt" style="font-size:12px">aprovadas</td><td class="re-txt" style="font-size:12px">reprovadas</td></tr>
    ${linhas}
  </tbody></table>
</div>

${rotulos ? `<div class="card"><h2>Por rótulo</h2><table><tbody>${rotulos}</tbody></table></div>` : ''}
</body></html>`;
}

/**
 * GET /api/dev/analise-imagem
 * Resumo das análises de foto dos trajetos validados — para calibrar o limiar
 * (`IMAGE_ANALYSIS_MIN_CONFIDENCE`) antes de ligar o modo blocking.
 *
 * Devolve HTML no navegador (página que atualiza sozinha) e JSON via curl/fetch.
 * Só reflete check-ins que foram validados (em modo advisory, todos ganham
 * `analiseFoto`; em blocking, fotos reprovadas não viram trajeto).
 */
devRouter.get('/analise-imagem', (req, res) => {
  const resultado = calcularResumo();
  if (req.query.format !== 'json' && req.accepts(['json', 'html']) === 'html') {
    // Página de dev em localhost: libera o CSS inline que o helmet bloquearia.
    res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
    return res.type('html').send(renderHtml(resultado));
  }
  res.json(resultado);
});
