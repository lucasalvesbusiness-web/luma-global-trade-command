import type { LatLng } from '@/lib/canvas/types';

/**
 * Gera a rota great-circle (o menor arco sobre a esfera) entre dois pontos,
 * amostrada em `segments+1` posições. Retorna pares [lng, lat] no formato
 * GeoJSON — pronto para alimentar uma LineString.
 *
 * Referência: fórmulas de Chris Veness (ed-williams.com / movable-type.co.uk).
 */
export function greatCircleArc(
  from: LatLng,
  to: LatLng,
  segments = 96,
): [number, number][] {
  const lat1 = (from.lat * Math.PI) / 180;
  const lon1 = (from.lng * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const lon2 = (to.lng * Math.PI) / 180;

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2,
      ),
    );

  // Se os pontos são (praticamente) iguais, devolve só os endpoints
  if (d < 1e-9) {
    return [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ];
  }

  const coords: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x ** 2 + y ** 2));
    const lon = Math.atan2(y, x);
    coords.push([(lon * 180) / Math.PI, (lat * 180) / Math.PI]);
  }
  return coords;
}
