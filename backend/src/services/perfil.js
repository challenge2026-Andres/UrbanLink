import { lerStore } from '../store/store.js';
import { calcularNivel, chaveSemana, desafioSemanal } from './gamificacao.js';

const round = (n, casas = 1) => {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
};

/** Opções de resgate de créditos Ecoa. */
export const OPCOES_RESGATE = [
  { id: 'passagem', titulo: 'Crédito em passagem', descricao: '1 passagem de ônibus', icone: 'ticket', custo: 500 },
  { id: 'descontos', titulo: 'Descontos em parceiros', descricao: 'Cupom com parceiros SoulUp', icone: 'tag', custo: 750 },
  { id: 'cashback', titulo: 'Cashback', descricao: 'Crédito na fatura de energia', icone: 'cash', custo: 1000 },
];

/** Trajetos concluídos na semana corrente. */
function trajetosNaSemana(trajetos, semana = chaveSemana()) {
  return trajetos.filter((t) => chaveSemana(new Date(t.validadoEm)) === semana).length;
}

/**
 * Monta o perfil consolidado do usuário (impacto, nível, desafio, conquistas).
 */
export function montarPerfil() {
  const { usuario, trajetos, desafiosSemanaisConcluidos } = lerStore();

  const totalTrajetos = trajetos.length;
  const distanciaKm = round(trajetos.reduce((s, t) => s + t.distanciaKm, 0));
  const co2EvitadoKg = round(trajetos.reduce((s, t) => s + t.co2EvitadoKg, 0), 2);

  const semana = chaveSemana();
  const feitosNaSemana = trajetosNaSemana(trajetos, semana);

  const conquistas = [
    { id: 'trajetos-10', label: '10', caption: 'Trajetos', unlocked: totalTrajetos >= 10 },
    { id: 'co2-5', label: '5 kg', caption: 'de CO₂', unlocked: co2EvitadoKg >= 5 },
    { id: 'viajante', label: 'Viajante', caption: 'frequente', unlocked: feitosNaSemana >= 5 },
  ];

  return {
    nome: usuario.nome,
    pontos: usuario.pontos,
    ecoaSaldo: usuario.ecoaSaldo,
    nivel: calcularNivel(totalTrajetos),
    impacto: { trajetos: totalTrajetos, distanciaKm, co2EvitadoKg },
    desafioSemana: {
      titulo: 'Mobilidade sustentável',
      descricao: `Faça ${desafioSemanal.meta} trajetos de transporte público`,
      atual: Math.min(feitosNaSemana, desafioSemanal.meta),
      meta: desafioSemanal.meta,
      recompensa: desafioSemanal.recompensa,
      concluido: Boolean(desafiosSemanaisConcluidos[semana]),
    },
    conquistas,
  };
}

/** Monta a carteira Ecoa (saldo, histórico, opções de resgate). */
export function montarCarteira() {
  const { usuario, lancamentos } = lerStore();
  return {
    saldo: usuario.ecoaSaldo,
    opcoesResgate: OPCOES_RESGATE,
    historico: [...lancamentos].sort((a, b) => b.em.localeCompare(a.em)).slice(0, 30),
  };
}
