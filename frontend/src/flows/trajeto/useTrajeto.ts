import { useContext } from 'react'
import { TrajetoContext, type TrajetoContextValue } from './context'

export function useTrajeto(): TrajetoContextValue {
  const ctx = useContext(TrajetoContext)
  if (!ctx) throw new Error('useTrajeto deve ser usado dentro de <TrajetoProvider>.')
  return ctx
}
