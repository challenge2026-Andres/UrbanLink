/** Modos de transporte oferecidos na tela de novo trajeto. */
export type TransportMode = 'onibus' | 'trem' | 'metro'

/** Nível de gamificação do usuário. */
export interface Nivel {
  numero: number
  nome: string
  trajetosParaProximo: number
  progresso: number // 0..1
}

/** Métricas de impacto acumulado. */
export interface Impacto {
  trajetos: number
  distanciaKm: number
  co2EvitadoKg: number
}

/** Desafio semanal. */
export interface DesafioSemana {
  titulo: string
  descricao: string
  atual: number
  meta: number
  recompensa: number
  concluido: boolean
}

/** Conquista/badge. */
export interface Conquista {
  id: string
  label: string
  caption: string
  unlocked: boolean
}

/** Perfil consolidado (GET /api/perfil). */
export interface Perfil {
  nome: string
  pontos: number
  ecoaSaldo: number
  nivel: Nivel
  impacto: Impacto
  desafioSemana: DesafioSemana
  conquistas: Conquista[]
}

/** Opção de resgate de créditos Ecoa. */
export interface OpcaoResgate {
  id: string
  titulo: string
  descricao: string
  icone: 'ticket' | 'cash' | 'tag'
  custo: number
}

/** Lançamento no histórico da carteira. */
export interface Lancamento {
  id: string
  tipo: 'credito_trajeto' | 'credito_desafio' | 'resgate'
  descricao: string
  detalhe: string
  valor: number // positivo = crédito, negativo = resgate
  em: string
}

/** Carteira Ecoa (GET /api/carteira). */
export interface Carteira {
  saldo: number
  opcoesResgate: OpcaoResgate[]
  historico: Lancamento[]
}

/** Recompensa concedida por um trajeto validado. */
export interface Recompensa {
  distanciaKm: number
  co2EvitadoKg: number
  pontos: number
  ecoa: number
}
