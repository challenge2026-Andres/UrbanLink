import { House, MessageCircle, Plus, CirclePlay, Users } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import styles from './BottomNav.module.css'

/**
 * Barra de navegação inferior.
 * Home e o botão central (+) já navegam; Comunidade, Stories e Chat são
 * placeholders visuais que serão ligados em fases futuras.
 */
export function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
      >
        <House size={22} />
        <span className="visually-hidden">Início</span>
      </NavLink>

      <button type="button" className={styles.item} aria-label="Comunidade" disabled>
        <Users size={22} />
      </button>

      <button
        type="button"
        className={styles.fab}
        aria-label="Novo trajeto"
        onClick={() => navigate('/novo-trajeto')}
      >
        <Plus size={24} />
      </button>

      <button type="button" className={styles.item} aria-label="Stories" disabled>
        <CirclePlay size={22} />
      </button>

      <button type="button" className={styles.item} aria-label="Mensagens" disabled>
        <MessageCircle size={22} />
      </button>
    </nav>
  )
}
