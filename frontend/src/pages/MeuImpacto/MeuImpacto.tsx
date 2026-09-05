import { ProgressBar } from '../../components/ProgressBar/ProgressBar'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import { StatCard } from '../../components/StatCard/StatCard'
import { achievements, impact, level } from '../../data/mock'
import styles from './MeuImpacto.module.css'

/** Painel de impacto: CO₂ evitado no mês, jornada, nível e conquistas. */
export function MeuImpacto() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <ScreenHeader title="Meu Impacto" backTo="/" tone="light" />
        <div className={styles.heroFigure}>
          <span className={styles.heroCaption}>Seu impacto este mês</span>
          <strong className={styles.heroValue}>
            {impact.co2AvoidedKg.toLocaleString('pt-BR')} Kg
          </strong>
          <span className={styles.heroCaption}>de CO₂ evitado</span>
        </div>
      </div>

      <div className={styles.sheet}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sua Jornada</h2>
          <div className={styles.stats}>
            <StatCard tone="filled" value={String(impact.trips)} label="Trajetos" />
            <StatCard tone="filled" value={`${impact.distanceKm} KM`} label="Percorridos" />
            <StatCard
              tone="filled"
              value={`${impact.co2AvoidedKg.toLocaleString('pt-BR')} Kg`}
              label="CO₂ evitado"
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Seu nível</h2>
          <article className={styles.levelCard}>
            <div className={styles.levelHead}>
              <strong>{level.name}</strong>
              <span className={styles.levelBadge}>Nível {level.level}</span>
            </div>
            <ProgressBar value={level.progress} label={`Nível ${level.level}`} />
            <p className={styles.levelHint}>
              Mais {level.tripsToNextLevel} trajetos para chegar ao nível {level.level + 1}
            </p>
          </article>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Conquistas</h2>
          <div className={styles.achievements}>
            {achievements.map((item) => (
              <div
                key={item.id}
                className={`${styles.achievement} ${item.unlocked ? '' : styles.locked}`}
              >
                <span className={styles.achievementLabel}>{item.label}</span>
                <span className={styles.achievementCaption}>{item.caption}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
