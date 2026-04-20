import type { LatLng } from '@/lib/canvas/types';

export type ValePoi = {
  id: string;
  kind: 'landmark' | 'logistics_hub' | 'river_checkpoint';
  name: string;
  namePtBr: string;
  location: LatLng;
  blurbPtBr: string;
  blurbEn: string;
};

/**
 * Pontos de interesse do Vale do São Francisco — referências turísticas,
 * paisagísticas e logísticas que reforçam a identidade da região.
 */
export const valePois: ValePoi[] = [
  {
    id: 'poi-rio-sao-francisco',
    kind: 'river_checkpoint',
    name: 'São Francisco River',
    namePtBr: 'Rio São Francisco',
    location: { lat: -9.395, lng: -40.523 },
    blurbPtBr: 'A espinha dorsal da irrigação do Vale — "Velho Chico"',
    blurbEn: 'Backbone of Vale irrigation — "Velho Chico"',
  },
  {
    id: 'poi-petrolina',
    kind: 'logistics_hub',
    name: 'Petrolina (PE)',
    namePtBr: 'Petrolina (PE)',
    location: { lat: -9.3891, lng: -40.5031 },
    blurbPtBr: 'Hub logístico e comercial do polo frutícola',
    blurbEn: 'Logistics and commercial hub of the fruit belt',
  },
  {
    id: 'poi-juazeiro',
    kind: 'logistics_hub',
    name: 'Juazeiro (BA)',
    namePtBr: 'Juazeiro (BA)',
    location: { lat: -9.4131, lng: -40.5031 },
    blurbPtBr: 'Gêmea de Petrolina, margem baiana do São Francisco',
    blurbEn: 'Twin city of Petrolina, Bahia bank of the São Francisco',
  },
  {
    id: 'poi-lago-sobradinho',
    kind: 'landmark',
    name: 'Sobradinho Lake',
    namePtBr: 'Lago de Sobradinho',
    location: { lat: -9.65, lng: -40.83 },
    blurbPtBr: 'Reservatório que regula a água do Vale',
    blurbEn: 'Reservoir that regulates the Vale water supply',
  },
  {
    id: 'poi-lago-itaparica',
    kind: 'landmark',
    name: 'Itaparica Lake',
    namePtBr: 'Lago de Itaparica',
    location: { lat: -9.15, lng: -38.3 },
    blurbPtBr: 'Marco geográfico da bacia do São Francisco',
    blurbEn: 'Geographic landmark of the São Francisco basin',
  },
];

/**
 * Rotas logísticas (origem → porto) esquematizadas. Cada rota é uma
 * lista de [lng, lat] representando pontos intermediários aproximados.
 */
export type LogisticsRoute = {
  id: string;
  originSlug: string;
  portId: string;
  labelPtBr: string;
  labelEn: string;
  coordinates: [number, number][]; // [lng, lat] no formato GeoJSON
};

export const logisticsRoutes: LogisticsRoute[] = [
  {
    id: 'route-vale-norte-pecem',
    originSlug: 'fazenda-luma-vale-norte',
    portId: 'port-pecem',
    labelPtBr: 'Vale Norte → Pecém',
    labelEn: 'Vale Norte → Pecém',
    coordinates: [
      [-40.38, -9.17],
      [-40.0, -8.2],
      [-39.0, -6.5],
      [-38.7987, -3.5407],
    ],
  },
  {
    id: 'route-rio-claro-suape',
    originSlug: 'fazenda-luma-rio-claro',
    portId: 'port-suape',
    labelPtBr: 'Rio Claro → Suape',
    labelEn: 'Rio Claro → Suape',
    coordinates: [
      [-40.71, -9.52],
      [-39.5, -9.0],
      [-37.0, -8.7],
      [-34.9708, -8.3956],
    ],
  },
  {
    id: 'route-sertao-verde-pecem',
    originSlug: 'parceiro-sertao-verde',
    portId: 'port-pecem',
    labelPtBr: 'Sertão Verde → Pecém',
    labelEn: 'Sertão Verde → Pecém',
    coordinates: [
      [-40.88, -9.08],
      [-40.2, -7.5],
      [-39.3, -5.6],
      [-38.7987, -3.5407],
    ],
  },
  {
    id: 'route-agroindustrial-santos',
    originSlug: 'unidade-agroindustrial-luma',
    portId: 'port-santos',
    labelPtBr: 'Agroindustrial → Santos',
    labelEn: 'Agroindustrial → Santos',
    coordinates: [
      [-40.5, -9.39],
      [-41.5, -12.0],
      [-44.0, -17.0],
      [-46.3333, -23.9608],
    ],
  },
];
