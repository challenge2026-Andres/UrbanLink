import { Lock } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CameraCapture } from '../../components/CameraCapture/CameraCapture'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import { Stepper } from '../../components/Stepper/Stepper'
import { useTrajeto } from '../../flows/trajeto/useTrajeto'
import styles from './validar.module.css'
import { VALIDAR_STEPS } from './steps'

/** Passo 2: captura da foto ao vivo que comprova a presença no transporte. */
export function ValidarTrajetoFoto() {
  const navigate = useNavigate()
  const { linha, setFoto } = useTrajeto()

  if (!linha) return <Navigate to="/novo-trajeto" replace />

  function aoCapturar(dataUrl: string) {
    setFoto(dataUrl)
    navigate('/validar/revisao')
  }

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
            Aponte a câmera para o interior do transporte e toque em tirar foto.
          </p>
        </div>

        <CameraCapture onCapture={aoCapturar} />

        <p className={styles.privacy}>
          <Lock size={14} />
          A foto é usada só para validar o trajeto e não é armazenada.
        </p>
      </div>
    </div>
  )
}
