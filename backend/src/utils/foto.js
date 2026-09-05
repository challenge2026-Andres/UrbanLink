import { createHash } from 'node:crypto';

const DATA_URL_RE = /^data:(image\/(?:jpe?g|png|webp));base64,([A-Za-z0-9+/=]+)$/;

/**
 * Valida e inspeciona uma foto recebida como data URL base64, SEM armazená-la.
 *
 * A foto é prova anti-fraude do trajeto; por privacidade (e por ser Fase 3),
 * o backend apenas registra metadados e um hash — a imagem não é persistida.
 *
 * @param {string} dataUrl  Ex.: "data:image/jpeg;base64,...."
 * @param {number} maxBytes Tamanho máximo permitido da imagem decodificada.
 * @returns {{ ok: true, mime: string, bytes: number, sha256: string } | { ok: false, erro: string }}
 */
export function inspecionarFoto(dataUrl, maxBytes) {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) {
    return { ok: false, erro: 'A foto deve ser um data URL base64 de imagem (jpeg, png ou webp).' };
  }

  const [, mime, base64] = match;
  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return { ok: false, erro: 'Base64 da foto inválido.' };
  }

  if (buffer.byteLength === 0) {
    return { ok: false, erro: 'Foto vazia.' };
  }
  if (buffer.byteLength > maxBytes) {
    return { ok: false, erro: `Foto excede o tamanho máximo de ${Math.round(maxBytes / 1024)} KB.` };
  }

  const sha256 = createHash('sha256').update(buffer).digest('hex');
  return { ok: true, mime, bytes: buffer.byteLength, sha256 };
}
