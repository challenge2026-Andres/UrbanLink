import { Camera, Lock } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import { Stepper } from '../../components/Stepper/Stepper'
import { useTrajeto } from '../../flows/trajeto/useTrajeto'
import { prepararFoto } from '../../lib/imagem'
import styles from './validar.module.css'
import { VALIDAR_STEPS } from './steps'

/** Passo 2: captura da foto que comprova a presença no transporte. */
export function ValidarTrajetoFoto() {
  const navigate = useNavigate()
  const { linha, setFoto } = useTrajeto()
  const inputRef = useRef<HTMLInputElement>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!linha) return <Navigate to="/novo-trajeto" replace />

  async function onArquivo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // permite recapturar o mesmo arquivo
    if (!file) return

    setProcessando(true)
    setErro(null)
    try {
      const dataUrl = await prepararFoto(file)
      setFoto(dataUrl)
      navigate('/validar/revisao')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível usar essa foto.')
    } finally {
      setProcessando(false)
    }
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
            Fotografe o interior do transporte para comprovar que você está no trajeto.
          </p>
        </div>

        <button
          type="button"
          className={styles.camera}
          onClick={() => inputRef.current?.click()}
          disabled={processando}
        >
          <Camera size={32} />
          {processando ? 'Processando...' : 'Toque para abrir a câmera'}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="visually-hidden"
          onChange={onArquivo}
        />

        {erro && <p className={styles.erro}>{erro}</p>}

        <p className={styles.privacy}>
          <Lock size={14} />
          Sua foto será utilizada apenas para validação do trajeto.
        </p>
      </div>

      <footer className={styles.footer}>
        <Button onClick={() => inputRef.current?.click()} disabled={processando}>
          {processando ? 'Processando...' : 'Abrir câmera'}
        </Button>
      </footer>
    </div>
  )
}
