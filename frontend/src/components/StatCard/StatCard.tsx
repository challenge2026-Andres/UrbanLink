import styles from './StatCard.module.css'

interface StatCardProps {
  value: string
  label: string
  /** `plain` no fundo branco (Home), `filled` sobre header azul (Meu Impacto). */
  tone?: 'plain' | 'filled'
}

/** Cartão compacto de métrica (trajetos, km, CO₂...). */
export function StatCard({ value, label, tone = 'plain' }: StatCardProps) {
  return (
    <div className={`${styles.card} ${styles[tone]}`}>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  )
}
