import { env } from '../config/env.js';

/**
 * Regras de gamificação da Fase 4.
 *
 * ## CO₂ evitado
 * `co2EvitadoKg = distanciaKm × (fatorCarro − fatorOnibus)`
 * Fatores padrão (kg CO₂ por passageiro-km, configuráveis por env var):
 *  - carro particular: 0,171 (ocupação média ~1,5)
 *  - ônibus urbano:    0,089
 * Ou seja, ~0,082 kg de CO₂ evitados por km rodado de ônibus em vez de carro.
 * Referência de ordem de grandeza: fatores de emissão de transporte (DEFRA / MMA).
 *
 * ## Distância
 * Nesta fase usamos uma estimativa fixa por trajeto (`DISTANCIA_MEDIA_KM`,
 * padrão 7 km — próximo da média de viagem de ônibus urbano em SP). A evolução
 * natural é medir a distância real com check-in + check-out (Haversine).
 *
 * ## Pontos e Ecoa
 * `pontos = PONTOS_BASE + round(distanciaKm × PONTOS_POR_KM)`
 * `ecoa = pontos` (1 ponto de gamificação gera 1 crédito Ecoa resgatável).
 */

const g = env.gamificacao;

const round = (n, casas = 2) => {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
};

/**
 * Calcula a recompensa de um trajeto validado.
 * @param {{ distanciaKm?: number }} [params]
 * @returns {{ distanciaKm: number, co2EvitadoKg: number, pontos: number, ecoa: number }}
 */
export function calcularRecompensa({ distanciaKm = g.distanciaMediaKm } = {}) {
  const co2EvitadoKg = Math.max(
    0,
    round(distanciaKm * (g.fatorCo2CarroKgKm - g.fatorCo2OnibusKgKm)),
  );
  const pontos = g.pontosBase + Math.round(distanciaKm * g.pontosPorKm);
  return { distanciaKm: round(distanciaKm), co2EvitadoKg, pontos, ecoa: pontos };
}

const NOMES_NIVEL = [
  'Primeiros Passos',
  'Explorador Urbano',
  'Explorador Verde',
  'Guardião da Mobilidade',
  'Lenda Sustentável',
];

/**
 * Nível de gamificação a partir do total de trajetos concluídos.
 * @param {number} totalTrajetos
 */
export function calcularNivel(totalTrajetos) {
  const numero = Math.floor(totalTrajetos / g.trajetosPorNivel) + 1;
  const noNivel = totalTrajetos % g.trajetosPorNivel;
  return {
    numero,
    nome: NOMES_NIVEL[Math.min(numero - 1, NOMES_NIVEL.length - 1)],
    trajetosParaProximo: g.trajetosPorNivel - noNivel,
    progresso: noNivel / g.trajetosPorNivel,
  };
}

/**
 * Chave da semana ISO (segunda a domingo), ex. "2026-W37".
 * @param {Date} [date]
 */
export function chaveSemana(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const anoInicio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d - anoInicio) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, '0')}`;
}

export const desafioSemanal = {
  meta: g.desafioSemanalMeta,
  recompensa: g.desafioSemanalRecompensa,
};
