const EARTH_RADIUS_M = 6_371_000;

/** @param {number} deg */
const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Distância em metros entre dois pontos (fórmula de Haversine).
 *
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number} Distância em metros (arredondada).
 */
export function distanciaMetros(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h)));
}
