import { Bus, ChevronRight, Flame, Search, User, Wallet } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ProgressBar } from '../../components/ProgressBar/ProgressBar'
import { StatCard } from '../../components/StatCard/StatCard'
import { impact, user, weeklyChallenge } from '../../data/mock'
import styles from './Home.module.css'

/** Tela inicial: destaque para começar um trajeto + resumo de impacto e desafios. */
export function Home() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <span className={styles.points}>
          <Wallet size={16} />
          {user.points} Pts
        </span>
        <div className={styles.topbarActions}>
          <button type="button" aria-label="Buscar" className={styles.iconButton}>
            <Search size={20} />
          </button>
          <button type="button" aria-label="Sequência" className={styles.iconButton}>
            <Flame size={20} />
          </button>
          <button type="button" aria-label="Perfil" className={styles.avatar}>
            <User size={18} />
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.heroBrand}>UrbanLink</span>
          <h2 className={styles.heroTitle}>Mobilidade que Recompensa</h2>
          <p className={styles.heroSubtitle}>
            Transforme seus trajetos de transporte público em benefícios
          </p>
          <button
            type="button"
            className={styles.heroButton}
            onClick={() => navigate('/novo-trajeto')}
          >
            Começar Trajeto
            <ChevronRight size={16} />
          </button>
        </div>
        <span className={styles.heroIcon} aria-hidden>
          <Bus size={28} />
        </span>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Seu Impacto</h3>
        <div className={styles.stats}>
          <StatCard value={String(impact.trips)} label="Trajetos" />
          <StatCard value={`${impact.distanceKm} KM`} label="Percorridos" />
          <StatCard value={`${impact.co2AvoidedKg.toLocaleString('pt-BR')} Kg`} label="CO₂ evitado" />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Desafios da semana</h3>
          <Link to="/impacto" className={styles.link}>
            Ver todos
          </Link>
        </div>
        <article className={styles.challenge}>
          <div className={styles.challengeHead}>
            <div>
              <p className={styles.challengeTitle}>{weeklyChallenge.title}</p>
              <p className={styles.challengeDesc}>{weeklyChallenge.description}</p>
            </div>
            <span className={styles.challengeCount}>
              {weeklyChallenge.current} de {weeklyChallenge.target}
            </span>
          </div>
          <ProgressBar
            value={weeklyChallenge.current / weeklyChallenge.target}
            label={weeklyChallenge.title}
          />
        </article>
      </section>
    </div>
  )
}
