import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  /** Progresso de 0 a 1. */
  value: number
  label?: string
}

/** Barra de progresso fina usada em desafios e níveis. */
export function ProgressBar({ value, label }: ProgressBarProps) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100)
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={styles.fill} style={{ width: `${pct}%` }} />
    </div>
  )
}
