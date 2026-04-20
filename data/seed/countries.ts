import type { LatLng } from '@/lib/canvas/types';

export type SeedCountry = {
  iso2: string;
  name: string;
  namePtBr: string;
  region: string;
  /** Aproximação (centroide geográfico ou principal porto) para render no globo */
  centroid: LatLng;
  flagEmoji: string;
};

export const seedCountries: SeedCountry[] = [
  {
    iso2: 'NL',
    name: 'Netherlands',
    namePtBr: 'Países Baixos',
    region: 'Europe',
    centroid: { lat: 52.3676, lng: 4.9041 },
    flagEmoji: '🇳🇱',
  },
  {
    iso2: 'AE',
    name: 'United Arab Emirates',
    namePtBr: 'Emirados Árabes Unidos',
    region: 'Middle East',
    centroid: { lat: 25.2048, lng: 55.2708 },
    flagEmoji: '🇦🇪',
  },
  {
    iso2: 'US',
    name: 'United States',
    namePtBr: 'Estados Unidos',
    region: 'North America',
    centroid: { lat: 25.7617, lng: -80.1918 },
    flagEmoji: '🇺🇸',
  },
  {
    iso2: 'PT',
    name: 'Portugal',
    namePtBr: 'Portugal',
    region: 'Europe',
    centroid: { lat: 38.7223, lng: -9.1393 },
    flagEmoji: '🇵🇹',
  },
  {
    iso2: 'ES',
    name: 'Spain',
    namePtBr: 'Espanha',
    region: 'Europe',
    centroid: { lat: 39.4699, lng: -0.3763 },
    flagEmoji: '🇪🇸',
  },
  {
    iso2: 'BR',
    name: 'Brazil',
    namePtBr: 'Brasil',
    region: 'South America',
    centroid: { lat: -23.5505, lng: -46.6333 },
    flagEmoji: '🇧🇷',
  },
];

export function findCountry(iso2: string): SeedCountry | undefined {
  return seedCountries.find((c) => c.iso2 === iso2);
}
