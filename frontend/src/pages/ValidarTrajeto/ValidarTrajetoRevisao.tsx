import { Bus, Clock, MapPin } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import { Stepper } from '../../components/Stepper/Stepper'
import { useTrajeto } from '../../flows/trajeto/useTrajeto'
import { descreverSentido } from '../../lib/api'
import styles from './validar.module.css'
import { VALIDAR_STEPS } from './steps'

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** Passo 2 (revisão): confere foto e dados antes de enviar para validação. */
export function ValidarTrajetoRevisao() {
  const navigate = useNavigate()
  const { linha, foto, posicao } = useTrajeto()

  if (!linha || !foto || !posicao) return <Navigate to="/novo-trajeto" replace />

  return (
    <div className={styles.page}>
      <ScreenHeader title="Validar trajeto" backTo="/validar/foto" />
      <div className={styles.stepper}>
        <Stepper steps={VALIDAR_STEPS} current={1} />
      </div>

      <div className={styles.body}>
        <h2 className={styles.title}>Tudo certo com a foto?</h2>

        <img className={styles.preview} src={foto} alt="Foto do interior do transporte" />

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <Bus size={18} className={styles.detailIcon} />
            <span className={styles.detailLabel}>Ônibus</span>
            <span className={styles.detailValue}>
              Linha {linha.lt} · {descreverSentido(linha)}
            </span>
          </div>
          <div className={styles.detailRow}>
            <MapPin size={18} className={styles.detailIcon} />
            <span className={styles.detailLabel}>Localização</span>
            <span className={styles.detailValue}>
              precisão ±{Math.round(posicao.accuracy)} m
            </span>
          </div>
          <div className={styles.detailRow}>
            <Clock size={18} className={styles.detailIcon} />
            <span className={styles.detailLabel}>Horário</span>
            <span className={styles.detailValue}>{hora(posicao.capturadoEm)}</span>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <Button variant="secondary" onClick={() => navigate('/validar/foto')}>
          Tirar outra foto
        </Button>
        <Button onClick={() => navigate('/validar/processando')}>Validar trajeto</Button>
      </footer>
    </div>
  )
}
