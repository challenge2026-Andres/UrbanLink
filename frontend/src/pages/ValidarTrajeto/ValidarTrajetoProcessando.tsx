import { Check, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import { Stepper } from '../../components/Stepper/Stepper'
import { useTrajeto } from '../../flows/trajeto/useTrajeto'
import { ApiError, validarTrajeto } from '../../lib/api'
import { GeolocError, obterPosicaoAtual } from '../../lib/geo'
import styles from './validar.module.css'
import { VALIDAR_STEPS } from './steps'

const CHECKS = ['Foto recebida', 'Localização confirmada', 'Horário registrado']

/**
 * Passo 3: captura a posição mais recente, envia GPS + foto + horário ao
 * backend e encaminha para o resultado. Aqui acontece a validação real.
 */
export function ValidarTrajetoProcessando() {
  const navigate = useNavigate()
  const { linha, foto, setPosicao, setResultado } = useTrajeto()
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  // Efeito de disparo único: valida e navega para o resultado. Sem cancelamento
  // porque a tela sempre sai daqui (navega ou mostra erro com "tentar de novo").
  const jaRodou = useRef(false)

  useEffect(() => {
    if (!linha || !foto || jaRodou.current) return
    jaRodou.current = true

    ;(async () => {
      try {
        const posicao = await obterPosicaoAtual()
        setPosicao(posicao)

        const resultado = await validarTrajeto({
          codigoLinha: linha.cl,
          linha: { lt: linha.lt, sl: linha.sl, tp: linha.tp, ts: linha.ts },
          lat: posicao.lat,
          lng: posicao.lng,
          accuracy: Math.round(posicao.accuracy),
          capturadoEm: posicao.capturadoEm,
          foto,
        })
        setResultado(resultado)
        navigate('/validar/resultado', { replace: true })
      } catch (err) {
        if (err instanceof GeolocError || err instanceof ApiError) setErro(err.message)
        else setErro('Não foi possível validar o trajeto. Tente novamente.')
      }
    })()
  }, [linha, foto, tentativa, navigate, setPosicao, setResultado])

  if (!linha || !foto) return <Navigate to="/novo-trajeto" replace />

  function tentarNovamente() {
    jaRodou.current = false
    setErro(null)
    setTentativa((n) => n + 1)
  }

  return (
    <div className={styles.page}>
      <ScreenHeader title="Validar trajeto" backTo="/validar/revisao" />
      <div className={styles.stepper}>
        <Stepper steps={VALIDAR_STEPS} current={2} />
      </div>

      <div className={styles.body}>
        {erro ? (
          <>
            <div className={styles.spinnerWrap}>
              <span className={styles.alertMark}>
                <TriangleAlert size={32} />
              </span>
              <h2 className={styles.title}>Não foi possível validar</h2>
              <p className={styles.hint}>{erro}</p>
            </div>
            <div className={styles.footer}>
              <Button onClick={tentarNovamente}>Tentar novamente</Button>
              <Button variant="secondary" onClick={() => navigate('/novo-trajeto')}>
                Recomeçar
              </Button>
            </div>
          </>
        ) : (
          <>
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
              Estamos comparando sua localização com a posição real dos veículos da linha.
              Isso pode levar alguns segundos.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
