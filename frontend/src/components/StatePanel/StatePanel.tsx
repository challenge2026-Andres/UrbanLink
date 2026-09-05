import { Loader2 } from 'lucide-react'
import styles from './StatePanel.module.css'

interface StatePanelProps {
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

/** Painel de carregamento / erro reutilizável para telas que buscam dados. */
export function StatePanel({ loading, error, onRetry }: StatePanelProps) {
  if (loading) {
    return (
      <div className={styles.panel}>
        <Loader2 size={24} className={styles.spin} />
        <p>Carregando...</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className={styles.panel}>
        <p className={styles.error}>{error}</p>
        {onRetry && (
          <button type="button" className={styles.retry} onClick={onRetry}>
            Tentar novamente
          </button>
        )}
      </div>
    )
  }
  return null
}
