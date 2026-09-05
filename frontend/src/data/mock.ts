/**
 * Dados mockados para a Fase 2 (frontend base).
 * Na Fase 3/4 isto é substituído por chamadas reais ao backend.
 */
import type {
  Achievement,
  ImpactStats,
  RewardOption,
  TripDraft,
  UserLevel,
  UserProfile,
  WalletEntry,
  WeeklyChallenge,
} from '../types'

export const user: UserProfile = {
  name: 'Ana',
  points: 50,
  ecoaBalance: 1325,
}

export const impact: ImpactStats = {
  trips: 12,
  distanceKm: 74,
  co2AvoidedKg: 8.4,
}

export const level: UserLevel = {
  name: 'Explorador Verde',
  level: 4,
  tripsToNextLevel: 3,
  progress: 0.62,
}

export const weeklyChallenge: WeeklyChallenge = {
  id: 'wc-mobilidade',
  title: 'Mobilidade sustentável',
  description: 'Faça 5 trajetos de transporte público',
  current: 3,
  target: 5,
}

export const achievements: Achievement[] = [
  { id: 'a1', label: '10', caption: 'Trajetos', unlocked: true },
  { id: 'a2', label: '5 kg', caption: 'de CO₂', unlocked: true },
  { id: 'a3', label: 'Viajante', caption: 'frequente', unlocked: false },
]

export const rewardOptions: RewardOption[] = [
  { id: 'r1', title: 'Crédito em passagem', requirement: 'A partir de 500 Ecoa', icon: 'ticket' },
  { id: 'r2', title: 'Cashback', requirement: 'A partir de 1.000 Ecoa', icon: 'cash' },
  { id: 'r3', title: 'Descontos em parceiros', requirement: 'A partir de 750 Ecoa', icon: 'tag' },
]

export const walletHistory: WalletEntry[] = [
  { id: 'w1', label: 'Trajeto validado', detail: 'Ônibus · Linha 875A', amount: 85, when: 'Hoje, 14:05' },
  { id: 'w2', label: 'Desafio semanal', detail: 'Mobilidade sustentável', amount: 150, when: 'Ontem' },
  { id: 'w3', label: 'Crédito em passagem', detail: 'Resgate', amount: -500, when: '22 ago' },
]

/** Trajeto de exemplo usado no fluxo "Validar trajeto". */
export const sampleTrip: TripDraft = {
  mode: 'onibus',
  line: '875A',
  location: 'São Paulo, SP',
  time: '14:05',
  distanceKm: 8.2,
  co2AvoidedKg: 1.3,
  reward: 85,
}
