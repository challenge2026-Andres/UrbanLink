import { Bus, Check, MapPin, TrainFront, TramFront } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { ScreenHeader } from '../../components/ScreenHeader/ScreenHeader'
import type { TransportMode } from '../../types'
import styles from './NovoTrajeto.module.css'

const MODES: { id: TransportMode; label: string; Icon: typeof Bus }[] = [
  { id: 'onibus', label: 'Ônibus', Icon: Bus },
  { id: 'trem', label: 'Trem', Icon: TrainFront },
  { id: 'metro', label: 'Metrô', Icon: TramFront },
]

/** Passo inicial de um trajeto: escolher transporte e informar a linha. */
export function NovoTrajeto() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<TransportMode>('onibus')
  const [line, setLine] = useState('')

  return (
    <div className={styles.page}>
      <ScreenHeader title="Novo trajeto" backTo="/" />

      <div className={styles.body}>
        <div>
          <h2 className={styles.title}>Como você está se locomovendo?</h2>
          <p className={styles.subtitle}>Selecione o transporte que você está utilizando.</p>
        </div>

        <div className={styles.modes} role="radiogroup" aria-label="Tipo de transporte">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mode === id}
              className={`${styles.mode} ${mode === id ? styles.modeSelected : ''}`}
              onClick={() => setMode(id)}
            >
              {mode === id && (
                <span className={styles.modeCheck} aria-hidden>
                  <Check size={12} />
                </span>
              )}
              <Icon size={24} />
              {label}
            </button>
          ))}
        </div>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Linha</span>
          <input
            className={styles.input}
            type="text"
            inputMode="text"
            placeholder="Número ou nome da linha"
            value={line}
            onChange={(event) => setLine(event.target.value)}
          />
        </label>

        <div className={styles.location}>
          <MapPin size={20} className={styles.locationIcon} />
          <div>
            <p className={styles.locationTitle}>
              Localização ativada
              <span className={styles.locationDot} aria-hidden />
            </p>
            <p className={styles.locationHint}>Usaremos sua localização para validar o trajeto.</p>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <Button onClick={() => navigate('/validar/foto')} disabled={line.trim().length === 0}>
          Abrir câmera
        </Button>
      </footer>
    </div>
  )
}
