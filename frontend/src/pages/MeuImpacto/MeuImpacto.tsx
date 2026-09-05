import { ProgressBar } from '../../components/ProgressBar/ProgressBar'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import { StatCard } from '../../components/StatCard/StatCard'
import { StatePanel } from '../../components/StatePanel/StatePanel'
import { useApi } from '../../hooks/useApi'
import { getPerfil } from '../../lib/api'
import styles from './MeuImpacto.module.css'

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** Painel de impacto: CO₂ evitado, jornada, nível e conquistas. */
export function MeuImpacto() {
  const { data: perfil, loading, error, reload } = useApi(getPerfil)

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <ScreenHeader title="Meu Impacto" backTo="/" tone="light" />
        <div className={styles.heroFigure}>
          <span className={styles.heroCaption}>Seu impacto acumulado</span>
          <strong className={styles.heroValue}>
            {perfil ? nf.format(perfil.impacto.co2EvitadoKg) : '0'} Kg
          </strong>
          <span className={styles.heroCaption}>de CO₂ evitado</span>
        </div>
      </div>

      <div className={styles.sheet}>
        {!perfil ? (
          <StatePanel loading={loading} error={error} onRetry={reload} />
        ) : (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Sua Jornada</h2>
              <div className={styles.stats}>
                <StatCard tone="filled" value={String(perfil.impacto.trajetos)} label="Trajetos" />
                <StatCard
                  tone="filled"
                  value={`${nf.format(perfil.impacto.distanciaKm)} KM`}
                  label="Percorridos"
                />
                <StatCard
                  tone="filled"
                  value={`${nf.format(perfil.impacto.co2EvitadoKg)} Kg`}
                  label="CO₂ evitado"
                />
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Seu nível</h2>
              <article className={styles.levelCard}>
                <div className={styles.levelHead}>
                  <strong>{perfil.nivel.nome}</strong>
                  <span className={styles.levelBadge}>Nível {perfil.nivel.numero}</span>
                </div>
                <ProgressBar
                  value={perfil.nivel.progresso}
                  label={`Nível ${perfil.nivel.numero}`}
                />
                <p className={styles.levelHint}>
                  Mais {perfil.nivel.trajetosParaProximo}{' '}
                  {perfil.nivel.trajetosParaProximo === 1 ? 'trajeto' : 'trajetos'} para chegar ao
                  nível {perfil.nivel.numero + 1}
                </p>
              </article>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Conquistas</h2>
              <div className={styles.achievements}>
                {perfil.conquistas.map((item) => (
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
          </>
        )}
      </div>
    </div>
  )
}
