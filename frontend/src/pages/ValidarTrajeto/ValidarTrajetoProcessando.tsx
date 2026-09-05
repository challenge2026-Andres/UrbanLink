import { Check } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import { Stepper } from '../../components/Stepper/Stepper'
import styles from './validar.module.css'
import { VALIDAR_STEPS } from './steps'

const CHECKS = ['Foto recebida', 'Localização confirmada', 'Horário registrado']

/**
 * Passo 3: tela de processamento. Na Fase 2 apenas simula a validação e
 * avança para o resultado; na Fase 3 aqui entra a chamada real ao backend.
 */
export function ValidarTrajetoProcessando() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/validar/sucesso', { replace: true }), 2600)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className={styles.page}>
      <ScreenHeader title="Validar trajeto" backTo="/validar/revisao" />
      <div className={styles.stepper}>
        <Stepper steps={VALIDAR_STEPS} current={2} />
      </div>

      <div className={styles.body}>
        <div className={styles.spinnerWrap}>
          <div className={styles.spinner} aria-hidden />
          <h2 className={styles.title}>Validando seu trajeto...</h2>
        </div>

        <ul className={styles.checklist}>
          {CHECKS.map((label) => (
            <li key={label} className={styles.checkItem}>
              <Check size={18} className={styles.checkDone} />
              {label}
            </li>
          ))}
          <li className={`${styles.checkItem} ${styles.checkPending}`}>
            <span
              className={styles.spinner}
              style={{ width: 18, height: 18, borderWidth: 3 }}
              aria-hidden
            />
            Verificando trajeto...
          </li>
        </ul>

        <p className={styles.hint}>
          Estamos verificando as informações do seu transporte. Isso pode levar alguns segundos.
        </p>
      </div>
    </div>
  )
}
