/** Modos de transporte suportados na validação de trajeto. */
export type TransportMode = 'onibus' | 'trem' | 'metro'

/** Métricas de impacto acumulado do usuário. */
export interface ImpactStats {
  trips: number
  distanceKm: number
  co2AvoidedKg: number
}

/** Nível de gamificação do usuário. */
export interface UserLevel {
  name: string
  level: number
  tripsToNextLevel: number
  progress: number // 0..1
}

/** Desafio semanal exibido na Home e em "Meu Impacto". */
export interface WeeklyChallenge {
  id: string
  title: string
  description: string
  current: number
  target: number
}

/** Conquista/badge do usuário. */
export interface Achievement {
  id: string
  label: string
  caption: string
  unlocked: boolean
}

/** Opção de resgate de créditos Ecoa. */
export interface RewardOption {
  id: string
  title: string
  requirement: string
  icon: 'ticket' | 'cash' | 'tag'
}

/** Lançamento no histórico da carteira Ecoa. */
export interface WalletEntry {
  id: string
  label: string
  detail: string
  amount: number // positivo = crédito, negativo = resgate
  when: string
}

/** Dados de um trajeto em validação (fluxo "Validar trajeto"). */
export interface TripDraft {
  mode: TransportMode
  line: string
  location: string
  time: string
  distanceKm: number
  co2AvoidedKg: number
  reward: number
}

/** Perfil resumido do usuário para o cabeçalho. */
export interface UserProfile {
  name: string
  points: number
  ecoaBalance: number
}
