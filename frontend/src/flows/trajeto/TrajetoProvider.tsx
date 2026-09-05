import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ESTADO_INICIAL,
  TrajetoContext,
  type TrajetoContextValue,
  type TrajetoState,
} from './context'

/** Guarda o estado do fluxo "Novo trajeto → Validar trajeto" entre as telas. */
export function TrajetoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TrajetoState>(ESTADO_INICIAL)

  const patch = useCallback(
    <K extends keyof TrajetoState>(key: K, value: TrajetoState[K]) =>
      setState((prev) => ({ ...prev, [key]: value })),
    [],
  )

  const value = useMemo<TrajetoContextValue>(
    () => ({
      ...state,
      setMode: (mode) => patch('mode', mode),
      setLinha: (linha) => patch('linha', linha),
      setPosicao: (posicao) => patch('posicao', posicao),
      setFoto: (foto) => patch('foto', foto),
      setResultado: (resultado) => patch('resultado', resultado),
      reiniciar: () => setState(ESTADO_INICIAL),
    }),
    [state, patch],
  )

  return <TrajetoContext.Provider value={value}>{children}</TrajetoContext.Provider>
}
