import { Check } from 'lucide-react'
import styles from './Stepper.module.css'

interface StepperProps {
  steps: string[]
  /** Índice do passo atual (base 0). */
  current: number
}

/** Indicador de progresso em etapas (fluxo "Validar trajeto"). */
export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className={styles.list}>
      {steps.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'active' : 'todo'
        return (
          <li key={label} className={styles.step}>
            <span className={`${styles.dot} ${styles[state]}`}>
              {state === 'done' ? <Check size={14} /> : index + 1}
            </span>
            <span className={styles.label}>{label}</span>
            {index < steps.length - 1 && <span className={styles.line} aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}
