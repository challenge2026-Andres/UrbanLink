/** Maior dimensão (px) da foto após redimensionar. */
const MAX_DIMENSAO = 1280
/** Alvo de tamanho da foto comprimida (bytes). O backend aceita até 2 MiB. */
const ALVO_BYTES = 1_400_000

/**
 * Lê um arquivo de imagem (vindo da câmera) e devolve um data URL JPEG
 * redimensionado e comprimido, pronto para enviar ao backend.
 *
 * @throws {Error} Se o arquivo não for uma imagem válida.
 */
export async function prepararFoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('O arquivo selecionado não é uma imagem.')
  }

  const bitmap = await carregarBitmap(file)
  const escala = Math.min(1, MAX_DIMENSAO / Math.max(bitmap.width, bitmap.height))
  const largura = Math.round(bitmap.width * escala)
  const altura = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível processar a imagem.')
  ctx.drawImage(bitmap, 0, 0, largura, altura)
  if ('close' in bitmap) bitmap.close()

  // Reduz a qualidade progressivamente até caber no alvo de tamanho.
  let qualidade = 0.82
  let dataUrl = canvas.toDataURL('image/jpeg', qualidade)
  while (aproxBytes(dataUrl) > ALVO_BYTES && qualidade > 0.4) {
    qualidade -= 0.12
    dataUrl = canvas.toDataURL('image/jpeg', qualidade)
  }
  return dataUrl
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
