import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../lib/api'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Busca dados de uma função assíncrona (normalmente do `lib/api`), com
 * estados de carregamento/erro e recarga manual.
 */
export function useApi<T>(fn: () => Promise<T>): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let ativo = true
    // oxlint-disable-next-line set-state-in-effect -- inicia o carregamento a cada (re)busca
    setLoading(true)
    setError(null)
    fn()
      .then((result) => {
        if (ativo) setData(result)
      })
      .catch((err: unknown) => {
        if (ativo) {
          setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os dados.')
        }
      })
      .finally(() => {
        if (ativo) setLoading(false)
      })
    return () => {
      ativo = false
    }
    // `fn` é recriada a cada render nas páginas; a recarga é controlada por `nonce`.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce])

  return { data, loading, error, reload }
}
