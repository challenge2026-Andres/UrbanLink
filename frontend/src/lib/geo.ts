/** Posição capturada do dispositivo. */
export interface Posicao {
  lat: number
  lng: number
  accuracy: number
  /** ISO do momento da captura. */
  capturadoEm: string
}

export type ErroGeoloc = 'negado' | 'indisponivel' | 'timeout' | 'sem_suporte'

export class GeolocError extends Error {
  tipo: ErroGeoloc
  constructor(tipo: ErroGeoloc, message: string) {
    super(message)
    this.name = 'GeolocError'
    this.tipo = tipo
  }
}

const MENSAGENS: Record<ErroGeoloc, string> = {
  negado: 'Permissão de localização negada. Ative o GPS para validar o trajeto.',
  indisponivel: 'Não foi possível obter sua localização. Tente novamente ao ar livre.',
  timeout: 'A localização demorou para responder. Tente novamente.',
  sem_suporte: 'Este dispositivo não suporta geolocalização.',
}

/**
 * Obtém a posição atual do dispositivo via HTML5 Geolocation API.
 * Rejeita com {@link GeolocError} em caso de erro/permissão negada.
 */
export function obterPosicaoAtual(): Promise<Posicao> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeolocError('sem_suporte', MENSAGENS.sem_suporte))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          // Usa o relógio de parede em vez de `pos.timestamp`: alguns navegadores
          // retornam esse campo relativo ao carregamento da página, não ao epoch.
          capturadoEm: new Date().toISOString(),
        }),
      (err) => {
        const tipo: ErroGeoloc =
          err.code === err.PERMISSION_DENIED
            ? 'negado'
            : err.code === err.TIMEOUT
              ? 'timeout'
              : 'indisponivel'
        reject(new GeolocError(tipo, MENSAGENS[tipo]))
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  })
}

/** Lê o estado da permissão de geolocalização, quando a Permissions API existe. */
export async function estadoPermissaoGeoloc(): Promise<PermissionState | 'unknown'> {
  if (!('permissions' in navigator)) return 'unknown'
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    return status.state
  } catch {
    return 'unknown'
  }
}
