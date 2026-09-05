import { Camera, ImageUp, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { prepararFoto, prepararFotoDeVideo } from '../../lib/imagem'
import styles from './CameraCapture.module.css'

interface CameraCaptureProps {
  /** Recebe o data URL JPEG da foto capturada. */
  onCapture: (dataUrl: string) => void
}

type Estado = 'iniciando' | 'ativa' | 'erro'

const MENSAGEM_ERRO: Record<string, string> = {
  NotAllowedError: 'Permissão de câmera negada. Autorize a câmera para continuar.',
  NotFoundError: 'Nenhuma câmera encontrada neste dispositivo.',
  NotReadableError: 'A câmera está em uso por outro aplicativo.',
  sem_suporte: 'Este navegador não permite acesso à câmera.',
  inseguro: 'A câmera só funciona em HTTPS. Abra o app pela URL segura.',
}

/**
 * Captura da foto **ao vivo pela câmera** (getUserMedia). Não aceita upload da
 * galeria no caminho normal — o usuário precisa apontar a câmera agora, o que
 * dificulta fraudar o check-in com uma foto salva.
 *
 * Se a câmera não estiver disponível (sem permissão, sem hardware, navegador
 * antigo), cai para um seletor de arquivo como alternativa.
 */
export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<Estado>('iniciando')
  const [erro, setErro] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false

    async function abrir() {
      if (!window.isSecureContext) {
        setEstado('erro')
        setErro(MENSAGEM_ERRO.inseguro)
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado('erro')
        setErro(MENSAGEM_ERRO.sem_suporte)
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setEstado('ativa')
      } catch (err) {
        if (cancelado) return
        const nome = err instanceof DOMException ? err.name : ''
        setEstado('erro')
        setErro(MENSAGEM_ERRO[nome] ?? 'Não foi possível abrir a câmera.')
      }
    }

    abrir()
    return () => {
      cancelado = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [tentativa])

  function pararStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function capturar() {
    const video = videoRef.current
    if (!video || video.readyState < 2) return
    try {
      const dataUrl = prepararFotoDeVideo(video)
      pararStream()
      onCapture(dataUrl)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível capturar a foto.')
    }
  }

  async function onArquivo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setProcessando(true)
    setErro(null)
    try {
      onCapture(await prepararFoto(file))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível usar essa foto.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.viewport}>
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          playsInline
          muted
          hidden={estado !== 'ativa'}
        />
        {estado === 'iniciando' && (
          <div className={styles.overlay}>
            <RefreshCw size={28} className={styles.spin} />
            <span>Abrindo a câmera...</span>
          </div>
        )}
        {estado === 'erro' && (
          <div className={styles.overlay}>
            <Camera size={28} />
            <span>{erro}</span>
          </div>
        )}
        <span className={styles.mira} aria-hidden />
      </div>

      {estado === 'ativa' && (
        <button type="button" className={styles.disparar} onClick={capturar}>
          <Camera size={22} />
          Tirar foto
        </button>
      )}

      {estado === 'erro' && (
        <div className={styles.acoesErro}>
          <button
            type="button"
            className={styles.tentar}
            onClick={() => {
              setErro(null)
              setEstado('iniciando')
              setTentativa((n) => n + 1)
            }}
          >
            <RefreshCw size={16} />
            Tentar de novo
          </button>
          <button
            type="button"
            className={styles.galeria}
            onClick={() => inputRef.current?.click()}
            disabled={processando}
          >
            <ImageUp size={16} />
            {processando ? 'Processando...' : 'Escolher da galeria'}
          </button>
        </div>
      )}

      {erro && estado === 'ativa' && <p className={styles.erroInline}>{erro}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="visually-hidden"
        onChange={onArquivo}
      />
    </div>
  )
}
