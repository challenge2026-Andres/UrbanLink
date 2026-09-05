import { DollarSign, Tag, Ticket } from 'lucide-react'
import { useState } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import { StatePanel } from '../../components/StatePanel/StatePanel'
import { useApi } from '../../hooks/useApi'
import { ApiError, getCarteira, resgatarEcoa } from '../../lib/api'
import type { OpcaoResgate } from '../../types'
import styles from './CreditoEcoa.module.css'

const ICONE: Record<OpcaoResgate['icone'], typeof Ticket> = {
  ticket: Ticket,
  cash: DollarSign,
  tag: Tag,
}

const fmtEcoa = (v: number) => `${v > 0 ? '+' : ''}${v.toLocaleString('pt-BR')} Ecoa`

const fmtData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

/** Carteira Ecoa: saldo, opções de resgate e histórico de lançamentos. */
export function CreditoEcoa() {
  const { data: carteira, loading, error, reload } = useApi(getCarteira)
  const [selecionada, setSelecionada] = useState<OpcaoResgate | null>(null)
  const [resgatando, setResgatando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  async function confirmarResgate() {
    if (!selecionada) return
    setResgatando(true)
    setAviso(null)
    try {
      await resgatarEcoa(selecionada.id)
      setAviso(`${selecionada.titulo} resgatado!`)
      setSelecionada(null)
      reload()
    } catch (err) {
      setAviso(err instanceof ApiError ? err.message : 'Não foi possível resgatar.')
    } finally {
      setResgatando(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <ScreenHeader title="Crédito Ecoa" backTo="/" tone="light" />
        <div className={styles.balance}>
          <span className={styles.balanceCaption}>Saldo</span>
          <strong className={styles.balanceValue}>
            {(carteira?.saldo ?? 0).toLocaleString('pt-BR')} Ecoa
          </strong>
          <span className={styles.balanceCaption}>
            Seus créditos podem ser utilizados nos benefícios SoulUp
          </span>
        </div>
      </div>

      <div className={styles.sheet}>
        {!carteira ? (
          <StatePanel loading={loading} error={error} onRetry={reload} />
        ) : (
          <>
            {aviso && <p className={styles.aviso}>{aviso}</p>}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Troque seus créditos</h2>
              <ul className={styles.rewards}>
                {carteira.opcoesResgate.map((opcao) => {
                  const Icon = ICONE[opcao.icone]
                  const podeResgatar = carteira.saldo >= opcao.custo
                  return (
                    <li key={opcao.id}>
                      <button
                        type="button"
                        className={styles.reward}
                        disabled={!podeResgatar}
                        onClick={() => setSelecionada(opcao)}
                      >
                        <span className={styles.rewardIcon}>
                          <Icon size={18} />
                        </span>
                        <span className={styles.rewardText}>
                          <span className={styles.rewardTitle}>{opcao.titulo}</span>
                          <span className={styles.rewardRequirement}>
                            {podeResgatar
                              ? `${opcao.custo.toLocaleString('pt-BR')} Ecoa`
                              : `Faltam ${(opcao.custo - carteira.saldo).toLocaleString('pt-BR')} Ecoa`}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Histórico</h2>
              {carteira.historico.length === 0 ? (
                <p className={styles.vazio}>Nenhum lançamento ainda. Valide um trajeto para ganhar Ecoa.</p>
              ) : (
                <ul className={styles.history}>
                  {carteira.historico.map((entry) => (
                    <li key={entry.id} className={styles.entry}>
                      <div>
                        <p
                          className={`${styles.entryAmount} ${
                            entry.valor < 0 ? styles.negative : styles.positive
                          }`}
                        >
                          {fmtEcoa(entry.valor)}
                        </p>
                        <p className={styles.entryLabel}>{entry.descricao}</p>
                        <p className={styles.entryDetail}>{entry.detalhe}</p>
                      </div>
                      <span className={styles.entryWhen}>{fmtData(entry.em)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {selecionada && (
        <div className={styles.overlay} onClick={() => !resgatando && setSelecionada(null)}>
          <div className={styles.confirm} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Resgatar {selecionada.titulo}?</h3>
            <p className={styles.confirmText}>
              {selecionada.descricao} — {selecionada.custo.toLocaleString('pt-BR')} Ecoa serão
              debitados do seu saldo.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={() => setSelecionada(null)}
                disabled={resgatando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmOk}
                onClick={confirmarResgate}
                disabled={resgatando}
              >
                {resgatando ? 'Resgatando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
