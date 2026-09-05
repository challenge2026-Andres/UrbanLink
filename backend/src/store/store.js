import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';

/**
 * Persistência simples em arquivo JSON.
 *
 * Para o Challenge o app tem um único usuário de demonstração, então um
 * arquivo é suficiente e fácil de inspecionar/resetar. Se evoluir para
 * multiusuário/produção, trocar por um banco (ex: SQLite/Postgres).
 */

const FILE_PATH = fileURLToPath(new URL('../../data/store.json', import.meta.url));

/**
 * @typedef {object} Trajeto
 * @property {string} id
 * @property {number} codigoLinha
 * @property {string} letreiro
 * @property {1 | 2} sentido
 * @property {{ tp: string, ts: string }} terminais
 * @property {{ lat: number, lng: number, em: string }} embarque
 * @property {number} distanciaKm
 * @property {number} co2EvitadoKg
 * @property {number} pontos
 * @property {number} ecoa
 * @property {number | null} distanciaAoOnibusM
 * @property {string} fotoSha256
 * @property {{ aprovada: boolean, confianca: number, rotulo: string | null } | null} analiseFoto
 * @property {string} validadoEm
 */

/**
 * @typedef {object} Lancamento
 * @property {string} id
 * @property {'credito_trajeto' | 'credito_desafio' | 'resgate'} tipo
 * @property {string} descricao
 * @property {string} detalhe
 * @property {number} valor    Positivo = crédito, negativo = resgate.
 * @property {string} em
 */

/**
 * @typedef {object} StoreData
 * @property {{ id: string, nome: string, pontos: number, ecoaSaldo: number }} usuario
 * @property {Trajeto[]} trajetos
 * @property {Lancamento[]} lancamentos
 * @property {Record<string, boolean>} desafiosSemanaisConcluidos  Chave = "YYYY-Www".
 */

/** @returns {StoreData} */
function estadoInicial() {
  return {
    usuario: { id: 'demo', nome: 'Ana', pontos: 0, ecoaSaldo: 0 },
    trajetos: [],
    lancamentos: [],
    desafiosSemanaisConcluidos: {},
  };
}

/** @type {StoreData} */
let data;

function carregar() {
  try {
    if (existsSync(FILE_PATH)) {
      data = { ...estadoInicial(), ...JSON.parse(readFileSync(FILE_PATH, 'utf8')) };
      return;
    }
  } catch (err) {
    logger.error('[store] arquivo corrompido, recriando', { message: err.message });
  }
  data = estadoInicial();
  persistir();
}

function persistir() {
  mkdirSync(dirname(FILE_PATH), { recursive: true });
  writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

carregar();

/** Retorna uma cópia rasa do estado atual (somente leitura). */
export function lerStore() {
  return data;
}

/**
 * Aplica uma mutação ao estado e persiste no disco.
 * @param {(draft: StoreData) => void} fn
 * @returns {StoreData}
 */
export function atualizarStore(fn) {
  fn(data);
  persistir();
  return data;
}

/** Zera o estado (usado em testes/dev). */
export function resetarStore() {
  data = estadoInicial();
  persistir();
}
