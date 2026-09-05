import { createContext } from 'react'
import type { LinhaSptrans, ResultadoValidacao } from '../../lib/api'
import type { Posicao } from '../../lib/geo'
import type { TransportMode } from '../../types'

export interface TrajetoState {
  mode: TransportMode
  linha: LinhaSptrans | null
  posicao: Posicao | null
  foto: string | null
  resultado: ResultadoValidacao | null
}

export interface TrajetoContextValue extends TrajetoState {
  setMode: (mode: TransportMode) => void
  setLinha: (linha: LinhaSptrans | null) => void
  setPosicao: (posicao: Posicao | null) => void
  setFoto: (foto: string | null) => void
  setResultado: (resultado: ResultadoValidacao | null) => void
  /** Zera todo o fluxo (ao iniciar um novo trajeto). */
  reiniciar: () => void
}

export const ESTADO_INICIAL: TrajetoState = {
  mode: 'onibus',
  linha: null,
  posicao: null,
  foto: null,
  resultado: null,
}

export const TrajetoContext = createContext<TrajetoContextValue | null>(null)
