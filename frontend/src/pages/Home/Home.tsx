import { Bus, ChevronRight, Flame, Search, User, Wallet } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ProgressBar } from '../../components/ProgressBar/ProgressBar'
import { StatCard } from '../../components/StatCard/StatCard'
import { StatePanel } from '../../components/StatePanel/StatePanel'
import { useApi } from '../../hooks/useApi'
import { getPerfil } from '../../lib/api'
import styles from './Home.module.css'

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** Tela inicial: destaque para começar um trajeto + resumo de impacto e desafios. */
export function Home() {
  const navigate = useNavigate()
  const { data: perfil, loading, error, reload } = useApi(getPerfil)

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <span className={styles.points}>
          <Wallet size={16} />
          {perfil ? perfil.pontos : 0} Pts
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

      {!perfil ? (
        <StatePanel loading={loading} error={error} onRetry={reload} />
      ) : (
        <>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Seu Impacto</h3>
            <div className={styles.stats}>
              <StatCard value={String(perfil.impacto.trajetos)} label="Trajetos" />
              <StatCard value={`${nf.format(perfil.impacto.distanciaKm)} KM`} label="Percorridos" />
              <StatCard
                value={`${nf.format(perfil.impacto.co2EvitadoKg)} Kg`}
                label="CO₂ evitado"
              />
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
                  <p className={styles.challengeTitle}>{perfil.desafioSemana.titulo}</p>
                  <p className={styles.challengeDesc}>{perfil.desafioSemana.descricao}</p>
                </div>
                <span className={styles.challengeCount}>
                  {perfil.desafioSemana.atual} de {perfil.desafioSemana.meta}
                </span>
              </div>
              <ProgressBar
                value={perfil.desafioSemana.atual / perfil.desafioSemana.meta}
                label={perfil.desafioSemana.titulo}
              />
            </article>
          </section>
        </>
      )}
    </div>
  )
}
