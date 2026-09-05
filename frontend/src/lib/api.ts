/**
 * Cliente HTTP do backend UrbanLink.
 * A URL base vem de `VITE_API_URL` (em dev, o Vite faz proxy de `/api`).
 */

import type { Carteira, Perfil, Recompensa } from '../types'

const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

/** Linha retornada pela busca da SPTrans (via backend). */
export interface LinhaSptrans {
  /** Código interno da linha, usado na validação. */
  cl: number
  /** Letreiro, ex. "875A". */
  lt: string
  /** Sentido: 1 = terminal principal → secundário, 2 = inverso. */
  sl: 1 | 2
  /** Terminal principal. */
  tp: string
  /** Terminal secundário. */
  ts: string
  /** Linha circular. */
  lc: boolean
  tl: number
}

export type MotivoInvalido =
  | 'sem_veiculos'
  | 'fora_do_raio'
  | 'posicao_desatualizada'
  | 'timestamp_invalido'
  | 'foto_rejeitada'

export interface AnaliseFoto {
  executada: boolean
  aprovada: boolean
  confianca: number
  rotulo: string | null
  modo: 'advisory' | 'blocking'
  status: 'ok' | 'indisponivel' | 'desligada'
}

export interface ResultadoValidacao {
  valido: boolean
  motivo: MotivoInvalido | null
  validadoEm: string
  detalhes: {
    raioToleranciaM: number
    distanciaMetros: number | null
    veiculoMaisProximo: {
      prefixo: string | null
      lat: number
      lng: number
      capturadoEm: string | null
    } | null
    horaConsultaSptrans: string | null
    veiculosNaLinha: number
  }
  foto: {
    recebida: boolean
    bytes: number
    sha256: string
    /** Análise de conteúdo da foto; `null` quando a feature está desligada. */
    analise: AnaliseFoto | null
  }
  /** Recompensa concedida (só quando `valido`). */
  recompensa: Recompensa | null
  /** `true` se este trajeto concluiu o desafio semanal. */
  desafioConcluido: boolean
}

export interface ValidarTrajetoInput {
  codigoLinha: number
  linha: { lt: string; sl: 1 | 2; tp: string; ts: string }
  lat: number
  lng: number
  accuracy?: number
  capturadoEm: string
  foto: string
}

/** Erro de API com mensagem amigável já pronta para exibição. */
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', 0)
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      (data && typeof data.message === 'string' && data.message) ||
      'Ocorreu um erro inesperado. Tente novamente.'
    throw new ApiError(message, response.status)
  }
  return data as T
}

/** Busca linhas por número ou nome. */
export async function buscarLinhas(termo: string): Promise<LinhaSptrans[]> {
  const query = new URLSearchParams({ termosBusca: termo.trim() })
  const data = await request<{ linhas: LinhaSptrans[] }>(`/linhas/buscar?${query}`)
  return Array.isArray(data.linhas) ? data.linhas : []
}

/** Envia GPS + foto + horário para validação de presença no trajeto. */
export async function validarTrajeto(input: ValidarTrajetoInput): Promise<ResultadoValidacao> {
  return request<ResultadoValidacao>('/trajetos/validar', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** Perfil consolidado do usuário (impacto, nível, desafio, conquistas). */
export function getPerfil(): Promise<Perfil> {
  return request<Perfil>('/perfil')
}

/** Carteira Ecoa (saldo, opções de resgate, histórico). */
export function getCarteira(): Promise<Carteira> {
  return request<Carteira>('/carteira')
}

/** Resgata créditos Ecoa por uma opção do catálogo. */
export function resgatarEcoa(opcaoId: string): Promise<{ saldo: number }> {
  return request<{ saldo: number }>('/carteira/resgatar', {
    method: 'POST',
    body: JSON.stringify({ opcaoId }),
  })
}

/** Descrição do sentido de uma linha, ex. "Perdizes → Aeroporto". */
export function descreverSentido(linha: LinhaSptrans): string {
  const capitalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/(^|\s|-)\p{L}/gu, (m) => m.toUpperCase())
      .trim()
  const [origem, destino] = linha.sl === 1 ? [linha.tp, linha.ts] : [linha.ts, linha.tp]
  return `${capitalize(origem)} → ${capitalize(destino)}`
}
