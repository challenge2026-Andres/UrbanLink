import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sampleTrip } from '../../data/mock'
import styles from './validar.module.css'

/** Tela final: confirma a validação e o crédito adicionado à carteira. */
export function TrajetoValidado() {
  const navigate = useNavigate()

  return (
    <div className={styles.success}>
      <span className={styles.successMark}>
        <Check size={40} strokeWidth={3} />
      </span>
      <h1 className={styles.successTitle}>Trajeto validado!</h1>
      <p className={styles.successText}>
        Você contribuiu para uma mobilidade mais sustentável.
      </p>

      <div className={styles.receipt}>
        <p className={styles.receiptReward}>
          +{sampleTrip.reward.toLocaleString('pt-BR')} Ecoa
        </p>
        <p className={styles.receiptCaption}>Créditos adicionados à sua carteira</p>

        <div className={styles.receiptList}>
          <div className={styles.receiptRow}>
            <Check size={16} />
            <span>Ônibus</span>
            <span>Linha {sampleTrip.line}</span>
          </div>
          <div className={styles.receiptRow}>
            <Check size={16} />
            <span>{sampleTrip.distanceKm.toLocaleString('pt-BR')} km percorridos</span>
          </div>
          <div className={styles.receiptRow}>
            <Check size={16} />
            <span>{sampleTrip.co2AvoidedKg.toLocaleString('pt-BR')} kg CO₂ evitado</span>
          </div>
        </div>
      </div>

      <div className={styles.successActions}>
        <button
          type="button"
          className={styles.successPrimary}
          onClick={() => navigate('/impacto')}
        >
          Ver meu impacto
        </button>
        <button type="button" className={styles.successGhost} onClick={() => navigate('/')}>
          Voltar para UrbanLink
        </button>
      </div>
    </div>
  )
}
