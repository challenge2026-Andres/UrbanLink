import { Camera, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import { Stepper } from '../../components/Stepper/Stepper'
import styles from './validar.module.css'
import { VALIDAR_STEPS } from './steps'

/** Passo 2: captura da foto que comprova a presença no transporte. */
export function ValidarTrajetoFoto() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <ScreenHeader title="Validar trajeto" backTo="/novo-trajeto" />
      <div className={styles.stepper}>
        <Stepper steps={VALIDAR_STEPS} current={1} />
      </div>

      <div className={styles.body}>
        <div>
          <h2 className={styles.title}>Agora precisamos de uma foto</h2>
          <p className={styles.subtitle}>
            Fotografe o interior do transporte para comprovar que você está no trajeto.
          </p>
        </div>

        <div className={styles.camera}>
          <Camera size={32} />
        </div>

        <p className={styles.privacy}>
          <Lock size={14} />
          Sua foto será utilizada apenas para validação do trajeto.
        </p>
      </div>

      <footer className={styles.footer}>
        <Button onClick={() => navigate('/validar/revisao')}>Abrir câmera</Button>
      </footer>
    </div>
  )
}
