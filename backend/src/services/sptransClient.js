import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Cliente da API Olho Vivo da SPTrans.
 *
 * Responsabilidades:
 *  - Autenticar com a API Key (que vive SOMENTE no backend).
 *  - Manter o cookie de sessão (`apiCredentials`) retornado pela SPTrans.
 *  - Reautenticar automaticamente quando a sessão expira (resposta 401/403).
 *
 * A API da SPTrans funciona assim:
 *  1. `POST /Login/Autenticar?token=<API_KEY>` responde `true` e devolve um
 *     cookie de sessão via header `Set-Cookie`.
 *  2. As chamadas seguintes precisam reenviar esse cookie no header `Cookie`.
 *  3. A sessão expira após alguns minutos de inatividade -> repetir o passo 1.
 *
 * @see https://www.sptrans.com.br/desenvolvedores/
 */

/** Cookie de sessão atual (string no formato "nome=valor"). `null` = não autenticado. */
let sessionCookie = null;

/** Promise de autenticação em andamento, para evitar logins concorrentes. */
let authInFlight = null;

/**
 * Monta uma URL absoluta para um endpoint da SPTrans.
 * @param {string} path Ex.: "/Linha/Buscar"
 * @param {Record<string, string | number>} [query]
 * @returns {string}
 */
function buildUrl(path, query = {}) {
  const url = new URL(env.sptransBaseUrl + path);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * Extrai o cookie de sessão (`apiCredentials`) de uma resposta de autenticação.
 * @param {Response} response
 * @returns {string | null} "apiCredentials=..." ou null se não vier.
 */
function extractSessionCookie(response) {
  const cookies = response.headers.getSetCookie?.() ?? [];
  for (const raw of cookies) {
    const [pair] = raw.split(';');
    if (pair && pair.trim().toLowerCase().startsWith('apicredentials=')) {
      return pair.trim();
    }
  }
  return null;
}

/**
 * Autentica na SPTrans e guarda o cookie de sessão.
 * Chamadas concorrentes compartilham a mesma requisição de login.
 *
 * @returns {Promise<void>}
 * @throws {Error} Se a SPTrans recusar a API Key ou a rede falhar.
 */
async function authenticate() {
  if (authInFlight) return authInFlight;

  authInFlight = (async () => {
    const url = buildUrl('/Login/Autenticar', { token: env.sptransApiKey });
    logger.info('[sptrans] autenticando');

    const response = await fetch(url, { method: 'POST' });
    const body = await response.text();

    if (!response.ok || body.trim() !== 'true') {
      sessionCookie = null;
      throw new Error(
        `[sptrans] autenticação falhou (status ${response.status}, corpo "${body.trim()}"). ` +
          'Verifique a SPTRANS_API_KEY.',
      );
    }

    const cookie = extractSessionCookie(response);
    if (!cookie) {
      throw new Error('[sptrans] autenticação OK mas nenhum cookie de sessão foi retornado.');
    }

    sessionCookie = cookie;
    logger.info('[sptrans] autenticado com sucesso');
  })();

  try {
    await authInFlight;
  } finally {
    authInFlight = null;
  }
}

/**
 * Faz um GET autenticado a um endpoint da SPTrans, reautenticando uma vez
 * se a sessão estiver expirada.
 *
 * @param {string} path Ex.: "/Posicao/Linha"
 * @param {Record<string, string | number>} [query]
 * @returns {Promise<unknown>} JSON já parseado da resposta da SPTrans.
 * @throws {SptransError} Em erro de autenticação, rede ou resposta não-OK.
 */
export async function sptransGet(path, query = {}) {
  if (!sessionCookie) {
    await authenticate();
  }

  const url = buildUrl(path, query);

  const doRequest = () =>
    fetch(url, {
      method: 'GET',
      headers: { Cookie: sessionCookie, Accept: 'application/json' },
    });

  let response = await doRequest();

  // Sessão expirada: reautentica uma vez e repete.
  if (response.status === 401 || response.status === 403) {
    logger.warn('[sptrans] sessão expirada, reautenticando', { path });
    sessionCookie = null;
    await authenticate();
    response = await doRequest();
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new SptransError(
      `SPTrans respondeu ${response.status} para ${path}`,
      response.status === 401 || response.status === 403 ? 502 : 502,
      { path, upstreamStatus: response.status, upstreamBody: text.slice(0, 500) },
    );
  }

  try {
    return await response.json();
  } catch {
    throw new SptransError(`SPTrans retornou uma resposta não-JSON para ${path}`, 502, { path });
  }
}

/**
 * Erro de comunicação com a SPTrans, carregando o status HTTP que o backend
 * deve devolver ao cliente e metadados para log.
 */
export class SptransError extends Error {
  /**
   * @param {string} message
   * @param {number} httpStatus Status a devolver ao cliente do backend.
   * @param {Record<string, unknown>} [meta]
   */
  constructor(message, httpStatus = 502, meta = {}) {
    super(message);
    this.name = 'SptransError';
    this.httpStatus = httpStatus;
    this.meta = meta;
  }
}

// ---------------------------------------------------------------------------
// Wrappers de alto nível para os endpoints usados pelo projeto.
// ---------------------------------------------------------------------------

/**
 * Busca linhas de ônibus por número ou nome (correspondência parcial).
 * @param {string} termosBusca Ex.: "8000" ou "lapa"
 * @returns {Promise<Array<object>>} Linhas encontradas (campos abreviados da SPTrans).
 */
export function buscarLinhas(termosBusca) {
  return sptransGet('/Linha/Buscar', { termosBusca });
}

/**
 * Retorna a posição em tempo real dos veículos de uma linha.
 * @param {number} codigoLinha Código interno da linha (campo `cl` da busca).
 * @returns {Promise<object>} `{ hr, vs: [{ p, py, px, ... }] }`
 */
export function posicaoPorLinha(codigoLinha) {
  return sptransGet('/Posicao/Linha', { codigoLinha });
}

/**
 * Força uma nova autenticação. Útil em testes e no healthcheck.
 * @returns {Promise<void>}
 */
export async function reautenticar() {
  sessionCookie = null;
  await authenticate();
}

/** @returns {boolean} Se há um cookie de sessão em memória. */
export function estaAutenticado() {
  return sessionCookie !== null;
}
