import { ChevronRight, DollarSign, Tag, Ticket } from 'lucide-react'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import { rewardOptions, user, walletHistory } from '../../data/mock'
import type { RewardOption } from '../../types'
import styles from './CreditoEcoa.module.css'

const REWARD_ICON: Record<RewardOption['icon'], typeof Ticket> = {
  ticket: Ticket,
  cash: DollarSign,
  tag: Tag,
}

const formatEcoa = (value: number) =>
  `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR')} Ecoa`

/** Carteira Ecoa: saldo, opções de resgate e histórico de lançamentos. */
export function CreditoEcoa() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <ScreenHeader title="Crédito Ecoa" backTo="/" tone="light" />
        <div className={styles.balance}>
          <span className={styles.balanceCaption}>Saldo</span>
          <strong className={styles.balanceValue}>
            {user.ecoaBalance.toLocaleString('pt-BR')} Ecoa
          </strong>
          <span className={styles.balanceCaption}>
            Seus créditos podem ser utilizados nos benefícios SoulUp
          </span>
        </div>
      </div>

      <div className={styles.sheet}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Troque seus créditos</h2>
          <ul className={styles.rewards}>
            {rewardOptions.map((option) => {
              const Icon = REWARD_ICON[option.icon]
              return (
                <li key={option.id}>
                  <button type="button" className={styles.reward}>
                    <span className={styles.rewardIcon}>
                      <Icon size={18} />
                    </span>
                    <span className={styles.rewardText}>
                      <span className={styles.rewardTitle}>{option.title}</span>
                      <span className={styles.rewardRequirement}>{option.requirement}</span>
                    </span>
                    <ChevronRight size={18} className={styles.rewardChevron} />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Histórico</h2>
          <ul className={styles.history}>
            {walletHistory.map((entry) => (
              <li key={entry.id} className={styles.entry}>
                <div>
                  <p
                    className={`${styles.entryAmount} ${
                      entry.amount < 0 ? styles.negative : styles.positive
                    }`}
                  >
                    {formatEcoa(entry.amount)}
                  </p>
                  <p className={styles.entryLabel}>{entry.label}</p>
                  <p className={styles.entryDetail}>{entry.detail}</p>
                </div>
                <span className={styles.entryWhen}>{entry.when}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
