import { Bus, Check, Loader2, MapPin, Search, TrainFront, TramFront } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import { useTrajeto } from '../../flows/trajeto/useTrajeto'
import { ApiError, buscarLinhas, descreverSentido, type LinhaSptrans } from '../../lib/api'
import { GeolocError, obterPosicaoAtual } from '../../lib/geo'
import type { TransportMode } from '../../types'
import styles from './NovoTrajeto.module.css'

const MODES: { id: TransportMode; label: string; Icon: typeof Bus; disponivel: boolean }[] = [
  { id: 'onibus', label: 'Ônibus', Icon: Bus, disponivel: true },
  { id: 'trem', label: 'Trem', Icon: TrainFront, disponivel: false },
  { id: 'metro', label: 'Metrô', Icon: TramFront, disponivel: false },
]

/** Passo 1: escolher transporte, encontrar a linha e capturar a localização. */
export function NovoTrajeto() {
  const navigate = useNavigate()
  const { mode, setMode, linha, setLinha, setPosicao } = useTrajeto()

  const [termo, setTermo] = useState(linha?.lt ?? '')
  const [resultados, setResultados] = useState<LinhaSptrans[]>([])
  const [buscando, setBuscando] = useState(false)
  const [erroBusca, setErroBusca] = useState<string | null>(null)

  const [obtendoLocal, setObtendoLocal] = useState(false)
  const [erroLocal, setErroLocal] = useState<string | null>(null)

  const buscaSeq = useRef(0)

  // Busca de linhas com debounce sempre que o termo muda.
  useEffect(() => {
    const alvo = termo.trim()
    if (linha && alvo === linha.lt) return
    if (alvo.length < 2) {
      // oxlint-disable-next-line set-state-in-effect -- limpa resultados quando o termo fica curto
      setResultados([])
      setErroBusca(null)
      return
    }

    const seq = ++buscaSeq.current
    const timer = setTimeout(async () => {
      setBuscando(true)
      setErroBusca(null)
      try {
        const linhas = await buscarLinhas(alvo)
        if (seq === buscaSeq.current) setResultados(linhas)
      } catch (err) {
        if (seq === buscaSeq.current) {
          setResultados([])
          setErroBusca(err instanceof ApiError ? err.message : 'Falha ao buscar linhas.')
        }
      } finally {
        if (seq === buscaSeq.current) setBuscando(false)
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [termo, linha])

  function selecionarLinha(l: LinhaSptrans) {
    setLinha(l)
    setTermo(l.lt)
    setResultados([])
  }

  async function continuar() {
    if (!linha) return
    setObtendoLocal(true)
    setErroLocal(null)
    try {
      const posicao = await obterPosicaoAtual()
      setPosicao(posicao)
      navigate('/validar/foto')
    } catch (err) {
      setErroLocal(
        err instanceof GeolocError ? err.message : 'Não foi possível obter sua localização.',
      )
    } finally {
      setObtendoLocal(false)
    }
  }

  return (
    <div className={styles.page}>
      <ScreenHeader title="Novo trajeto" backTo="/" />

      <div className={styles.body}>
        <div>
          <h2 className={styles.title}>Como você está se locomovendo?</h2>
          <p className={styles.subtitle}>Selecione o transporte que você está utilizando.</p>
        </div>

        <div className={styles.modes} role="radiogroup" aria-label="Tipo de transporte">
          {MODES.map(({ id, label, Icon, disponivel }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mode === id}
              disabled={!disponivel}
              className={`${styles.mode} ${mode === id ? styles.modeSelected : ''}`}
              onClick={() => disponivel && setMode(id)}
            >
              {mode === id && (
                <span className={styles.modeCheck} aria-hidden>
                  <Check size={12} />
                </span>
              )}
              <Icon size={24} />
              {label}
              {!disponivel && <span className={styles.modeSoon}>em breve</span>}
            </button>
          ))}
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Linha</span>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              className={styles.input}
              type="text"
              inputMode="text"
              placeholder="Número ou nome da linha"
              value={termo}
              onChange={(event) => {
                setTermo(event.target.value)
                if (linha) setLinha(null)
              }}
            />
            {buscando && <Loader2 size={16} className={styles.spinIcon} aria-label="Buscando" />}
          </div>

          {erroBusca && <p className={styles.error}>{erroBusca}</p>}

          {resultados.length > 0 && !linha && (
            <ul className={styles.results}>
              {resultados.map((l) => (
                <li key={`${l.cl}`}>
                  <button type="button" className={styles.result} onClick={() => selecionarLinha(l)}>
                    <span className={styles.resultLine}>{l.lt}</span>
                    <span className={styles.resultSentido}>{descreverSentido(l)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {linha && (
            <div className={styles.selecionada}>
              <Check size={16} />
              <div>
                <p className={styles.resultLine}>Linha {linha.lt}</p>
                <p className={styles.resultSentido}>{descreverSentido(linha)}</p>
              </div>
              <button
                type="button"
                className={styles.trocar}
                onClick={() => {
                  setLinha(null)
                  setTermo('')
                }}
              >
                Trocar
              </button>
            </div>
          )}
        </div>

        <div className={styles.location}>
          <MapPin size={20} className={styles.locationIcon} />
          <div>
            <p className={styles.locationTitle}>Localização</p>
            <p className={styles.locationHint}>
              {erroLocal ?? 'Usaremos sua localização para validar o trajeto.'}
            </p>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <Button onClick={continuar} disabled={!linha || obtendoLocal}>
          {obtendoLocal ? 'Obtendo localização...' : 'Continuar'}
        </Button>
      </footer>
    </div>
  )
}
