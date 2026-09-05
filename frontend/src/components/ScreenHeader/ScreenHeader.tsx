import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import styles from './ScreenHeader.module.css'

interface ScreenHeaderProps {
  title: string
  /** Rota para voltar; se omitido, usa o histórico do navegador. */
  backTo?: string
  /** `light` sobre header azul; `dark` sobre fundo branco (padrão). */
  tone?: 'dark' | 'light'
}

/** Cabeçalho de tela interna: seta de voltar + título. */
export function ScreenHeader({ title, backTo, tone = 'dark' }: ScreenHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className={`${styles.header} ${styles[tone]}`}>
      <button
        type="button"
        className={styles.back}
        aria-label="Voltar"
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
      >
        <ChevronLeft size={22} />
      </button>
      <h1 className={styles.title}>{title}</h1>
    </header>
  )
}
