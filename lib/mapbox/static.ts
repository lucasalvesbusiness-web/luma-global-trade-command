import type { LatLng } from '@/lib/geo/types';

export type StaticImageOptions = {
  location: LatLng;
  /** Estilo do Mapbox. satellite-v9 = foto aérea; satellite-streets-v12 = com nomes */
  style?: 'satellite-v9' | 'satellite-streets-v12' | 'outdoors-v12';
  zoom?: number;
  bearing?: number;
  pitch?: number;
  width?: number;
  height?: number;
  /** Retina (@2x) para telas de alta densidade */
  retina?: boolean;
};

/**
 * Constrói uma URL do Mapbox Static Images API para um ponto geográfico.
 * Usa o mesmo token do mapa interativo — custo incluído no free tier.
 *
 * Exemplo:
 *   staticImageUrl({ location: { lat: 51.9225, lng: 4.4792 }, zoom: 12 })
 */
export function staticImageUrl(opts: StaticImageOptions): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || token === 'pk.replace_me') return '';

  const {
    location,
    style = 'satellite-streets-v12',
    zoom = 12,
    bearing = 0,
    pitch = 45,
    width = 480,
    height = 280,
    retina = true,
  } = opts;

  const suffix = retina ? '@2x' : '';
  return (
    `https://api.mapbox.com/styles/v1/mapbox/${style}/static/` +
    `${location.lng},${location.lat},${zoom},${bearing},${pitch}/` +
    `${width}x${height}${suffix}?access_token=${token}&logo=false&attribution=false`
  );
}
