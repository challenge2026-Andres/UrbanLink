import { Check, Leaf, MapPin, Route, Sparkles, X } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTrajeto } from '../../flows/trajeto/useTrajeto'
import type { MotivoInvalido } from '../../lib/api'
import { descreverSentido } from '../../lib/api'
import styles from './validar.module.css'

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

const MOTIVO_TEXTO: Record<MotivoInvalido, string> = {
  fora_do_raio: 'Você está longe demais de um ônibus dessa linha.',
  sem_veiculos: 'Não há veículos dessa linha em operação agora.',
  posicao_desatualizada: 'A posição dos ônibus está desatualizada. Tente de novo em instantes.',
  timestamp_invalido: 'O horário do seu dispositivo parece estar incorreto.',
}

/** Tela final: mostra o resultado da validação (sucesso ou falha). */
export function TrajetoValidado() {
  const navigate = useNavigate()
  const { linha, resultado, reiniciar } = useTrajeto()

  if (!resultado || !linha) return <Navigate to="/" replace />

  const { detalhes } = resultado

  function sair(rota: string) {
    reiniciar()
    navigate(rota)
  }

  if (!resultado.valido) {
    return (
      <div className={`${styles.success} ${styles.successFail}`}>
        <span className={`${styles.successMark} ${styles.successMarkFail}`}>
          <X size={40} strokeWidth={3} />
        </span>
        <h1 className={styles.successTitle}>Não conseguimos validar</h1>
        <p className={styles.successText}>
          {resultado.motivo ? MOTIVO_TEXTO[resultado.motivo] : 'Tente novamente.'}
        </p>

        {detalhes.distanciaMetros != null && (
          <div className={styles.receipt}>
            <div className={styles.receiptList}>
              <div className={styles.receiptRow}>
                <MapPin size={16} />
                <span>Distância ao ônibus mais próximo</span>
                <span>{detalhes.distanciaMetros} m</span>
              </div>
              <div className={styles.receiptRow}>
                <MapPin size={16} />
                <span>Limite de tolerância</span>
                <span>{detalhes.raioToleranciaM} m</span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.successActions}>
          <button
            type="button"
            className={styles.successPrimary}
            onClick={() => sair('/novo-trajeto')}
          >
            Tentar outro trajeto
          </button>
          <button type="button" className={styles.successGhost} onClick={() => sair('/')}>
            Voltar para UrbanLink
          </button>
        </div>
      </div>
    )
  }

  const r = resultado.recompensa

  return (
    <div className={styles.success}>
      <span className={styles.successMark}>
        <Check size={40} strokeWidth={3} />
      </span>
      <h1 className={styles.successTitle}>Trajeto validado!</h1>
      <p className={styles.successText}>Você contribuiu para uma mobilidade mais sustentável.</p>

      <div className={styles.receipt}>
        <p className={styles.receiptReward}>+{(r?.ecoa ?? 0).toLocaleString('pt-BR')} Ecoa</p>
        <p className={styles.receiptCaption}>
          {r ? `+${r.pontos} pontos` : 'Créditos adicionados à sua carteira'}
        </p>

        <div className={styles.receiptList}>
          <div className={styles.receiptRow}>
            <Check size={16} />
            <span>
              Linha {linha.lt} · {descreverSentido(linha)}
            </span>
          </div>
          {r && (
            <div className={styles.receiptRow}>
              <Route size={16} />
              <span>{nf.format(r.distanciaKm)} km percorridos (estimativa)</span>
            </div>
          )}
          {r && (
            <div className={styles.receiptRow}>
              <Leaf size={16} />
              <span>{nf.format(r.co2EvitadoKg)} kg de CO₂ evitado</span>
            </div>
          )}
        </div>
      </div>

      {resultado.desafioConcluido && (
        <p className={styles.desafio}>
          <Sparkles size={16} />
          Desafio semanal concluído! +150 Ecoa de bônus
        </p>
      )}

      <div className={styles.successActions}>
        <button
          type="button"
          className={styles.successPrimary}
          onClick={() => sair('/impacto')}
        >
          Ver meu impacto
        </button>
        <button type="button" className={styles.successGhost} onClick={() => sair('/')}>
          Voltar para UrbanLink
        </button>
      </div>
    </div>
  )
}
