import { randomUUID } from 'node:crypto';
import { atualizarStore, lerStore } from '../store/store.js';
import { logger } from '../utils/logger.js';
import { calcularRecompensa, chaveSemana, desafioSemanal } from './gamificacao.js';
import { OPCOES_RESGATE } from './perfil.js';

/**
 * Registra um trajeto validado: cria o registro, credita pontos + Ecoa e,
 * se for o caso, conclui o desafio semanal.
 *
 * @param {object} params
 * @param {number} params.codigoLinha
 * @param {{ lt: string, sl: 1 | 2, tp: string, ts: string }} params.linha
 * @param {{ lat: number, lng: number, em: string }} params.embarque
 * @param {{ distanciaMetros: number | null }} params.detalhes
 * @param {string} params.fotoSha256
 * @param {{ aprovada: boolean, confianca: number, rotulo: string | null } | null} [params.analiseFoto]
 * @param {string} params.validadoEm
 * @returns {{
 *   trajeto: import('../store/store.js').Trajeto,
 *   recompensa: { distanciaKm: number, co2EvitadoKg: number, pontos: number, ecoa: number },
 *   desafioConcluido: boolean
 * }}
 */
export function registrarTrajetoValidado({
  codigoLinha,
  linha,
  embarque,
  detalhes,
  fotoSha256,
  analiseFoto = null,
  validadoEm,
}) {
  const recompensa = calcularRecompensa();
  let saida;

  atualizarStore((d) => {
    const trajeto = {
      id: randomUUID(),
      codigoLinha,
      letreiro: linha.lt,
      sentido: linha.sl,
      terminais: { tp: linha.tp, ts: linha.ts },
      embarque,
      distanciaKm: recompensa.distanciaKm,
      co2EvitadoKg: recompensa.co2EvitadoKg,
      pontos: recompensa.pontos,
      ecoa: recompensa.ecoa,
      distanciaAoOnibusM: detalhes.distanciaMetros ?? null,
      fotoSha256,
      analiseFoto,
      validadoEm,
    };
    d.trajetos.push(trajeto);
    d.usuario.pontos += recompensa.pontos;
    d.usuario.ecoaSaldo += recompensa.ecoa;
    d.lancamentos.push({
      id: randomUUID(),
      tipo: 'credito_trajeto',
      descricao: 'Trajeto validado',
      detalhe: `Ônibus · Linha ${linha.lt}`,
      valor: recompensa.ecoa,
      em: validadoEm,
    });

    const semana = chaveSemana(new Date(validadoEm));
    const feitosNaSemana = d.trajetos.filter(
      (t) => chaveSemana(new Date(t.validadoEm)) === semana,
    ).length;

    let desafioConcluido = false;
    if (feitosNaSemana >= desafioSemanal.meta && !d.desafiosSemanaisConcluidos[semana]) {
      d.desafiosSemanaisConcluidos[semana] = true;
      d.usuario.ecoaSaldo += desafioSemanal.recompensa;
      d.lancamentos.push({
        id: randomUUID(),
        tipo: 'credito_desafio',
        descricao: 'Desafio semanal concluído',
        detalhe: 'Mobilidade sustentável',
        valor: desafioSemanal.recompensa,
        em: validadoEm,
      });
      desafioConcluido = true;
    }

    saida = { trajeto, recompensa, desafioConcluido };
  });

  logger.info('[recompensas] trajeto creditado', {
    linha: linha.lt,
    pontos: recompensa.pontos,
    ecoa: recompensa.ecoa,
  });
  return saida;
}

/**
 * Resgata créditos Ecoa por uma opção do catálogo.
 * @param {string} opcaoId
 * @returns {{ ok: true, saldo: number, opcao: object } | { ok: false, erro: string, status: number }}
 */
export function resgatarEcoa(opcaoId) {
  const opcao = OPCOES_RESGATE.find((o) => o.id === opcaoId);
  if (!opcao) {
    return { ok: false, erro: 'Opção de resgate inválida.', status: 400 };
  }

  const { usuario } = lerStore();
  if (usuario.ecoaSaldo < opcao.custo) {
    return { ok: false, erro: 'Saldo Ecoa insuficiente para este resgate.', status: 409 };
  }

  let saldo;
  atualizarStore((d) => {
    d.usuario.ecoaSaldo -= opcao.custo;
    d.lancamentos.push({
      id: randomUUID(),
      tipo: 'resgate',
      descricao: opcao.titulo,
      detalhe: 'Resgate',
      valor: -opcao.custo,
      em: new Date().toISOString(),
    });
    saldo = d.usuario.ecoaSaldo;
  });

  logger.info('[recompensas] resgate', { opcao: opcao.id, custo: opcao.custo });
  return { ok: true, saldo, opcao };
}
