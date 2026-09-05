/** Maior dimensão (px) da foto após redimensionar. */
const MAX_DIMENSAO = 1280
/** Alvo de tamanho da foto comprimida (bytes). O backend aceita até 2 MiB. */
const ALVO_BYTES = 1_400_000

type FonteImagem = ImageBitmap | HTMLImageElement | HTMLVideoElement

function dimensoes(fonte: FonteImagem): { largura: number; altura: number } {
  const w = fonte instanceof HTMLVideoElement ? fonte.videoWidth : fonte.width
  const h = fonte instanceof HTMLVideoElement ? fonte.videoHeight : fonte.height
  return { largura: w, altura: h }
}

/**
 * Redimensiona e comprime uma fonte de imagem (arquivo já decodificado ou frame
 * de vídeo) para um data URL JPEG pronto para enviar ao backend.
 */
function comprimir(fonte: FonteImagem): string {
  const { largura: w0, altura: h0 } = dimensoes(fonte)
  if (!w0 || !h0) throw new Error('Não foi possível ler a imagem.')

  const escala = Math.min(1, MAX_DIMENSAO / Math.max(w0, h0))
  const largura = Math.round(w0 * escala)
  const altura = Math.round(h0 * escala)

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível processar a imagem.')
  ctx.drawImage(fonte, 0, 0, largura, altura)

  // Reduz a qualidade progressivamente até caber no alvo de tamanho.
  let qualidade = 0.82
  let dataUrl = canvas.toDataURL('image/jpeg', qualidade)
  while (aproxBytes(dataUrl) > ALVO_BYTES && qualidade > 0.4) {
    qualidade -= 0.12
    dataUrl = canvas.toDataURL('image/jpeg', qualidade)
  }
  return dataUrl
}

/**
 * Lê um arquivo de imagem (fallback quando a câmera ao vivo não está disponível)
 * e devolve um data URL JPEG redimensionado e comprimido.
 * @throws {Error} Se o arquivo não for uma imagem válida.
 */
export async function prepararFoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('O arquivo selecionado não é uma imagem.')
  }
  const bitmap = await carregarBitmap(file)
  try {
    return comprimir(bitmap)
  } finally {
    if ('close' in bitmap) bitmap.close()
  }
}

/** Captura o frame atual de um `<video>` (câmera ao vivo) como data URL JPEG. */
export function prepararFotoDeVideo(video: HTMLVideoElement): string {
  return comprimir(video)
}

async function carregarBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      // Alguns navegadores falham com HEIC/orientação; cai no <img>.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Estima os bytes de um data URL base64. */
function aproxBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.floor((base64.length * 3) / 4)
}
