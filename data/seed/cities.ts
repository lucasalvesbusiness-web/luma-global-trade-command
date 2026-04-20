import type { LatLng } from '@/lib/canvas/types';

export type SeedCity = {
  id: string;
  countryIso2: string;
  name: string;
  isCapital?: boolean;
  location: LatLng;
};

export const seedCities: SeedCity[] = [
  // Netherlands
  { id: 'city-amsterdam', countryIso2: 'NL', name: 'Amsterdam', isCapital: true, location: { lat: 52.3676, lng: 4.9041 } },
  { id: 'city-rotterdam', countryIso2: 'NL', name: 'Rotterdam', location: { lat: 51.9225, lng: 4.4792 } },
  { id: 'city-eindhoven', countryIso2: 'NL', name: 'Eindhoven', location: { lat: 51.4416, lng: 5.4697 } },
  { id: 'city-utrecht', countryIso2: 'NL', name: 'Utrecht', location: { lat: 52.0907, lng: 5.1214 } },
  { id: 'city-the-hague', countryIso2: 'NL', name: 'The Hague / Den Haag', location: { lat: 52.0705, lng: 4.3007 } },

  // United Arab Emirates
  { id: 'city-abu-dhabi', countryIso2: 'AE', name: 'Abu Dhabi', isCapital: true, location: { lat: 24.4539, lng: 54.3773 } },
  { id: 'city-dubai', countryIso2: 'AE', name: 'Dubai', location: { lat: 25.2048, lng: 55.2708 } },
  { id: 'city-sharjah', countryIso2: 'AE', name: 'Sharjah', location: { lat: 25.3463, lng: 55.4209 } },
  { id: 'city-ajman', countryIso2: 'AE', name: 'Ajman', location: { lat: 25.4052, lng: 55.5136 } },
  { id: 'city-ras-al-khaimah', countryIso2: 'AE', name: 'Ras Al Khaimah', location: { lat: 25.7895, lng: 55.9432 } },

  // United States
  { id: 'city-washington-dc', countryIso2: 'US', name: 'Washington D.C.', isCapital: true, location: { lat: 38.9072, lng: -77.0369 } },
  { id: 'city-new-york', countryIso2: 'US', name: 'New York', location: { lat: 40.7128, lng: -74.006 } },
  { id: 'city-miami', countryIso2: 'US', name: 'Miami', location: { lat: 25.7617, lng: -80.1918 } },
  { id: 'city-los-angeles', countryIso2: 'US', name: 'Los Angeles', location: { lat: 34.0522, lng: -118.2437 } },
  { id: 'city-houston', countryIso2: 'US', name: 'Houston', location: { lat: 29.7604, lng: -95.3698 } },
  { id: 'city-philadelphia', countryIso2: 'US', name: 'Philadelphia', location: { lat: 39.9526, lng: -75.1652 } },
  { id: 'city-jacksonville', countryIso2: 'US', name: 'Jacksonville', location: { lat: 30.3322, lng: -81.6557 } },
  { id: 'city-savannah', countryIso2: 'US', name: 'Savannah', location: { lat: 32.0809, lng: -81.0912 } },

  // Portugal
  { id: 'city-lisboa', countryIso2: 'PT', name: 'Lisboa', isCapital: true, location: { lat: 38.7223, lng: -9.1393 } },
  { id: 'city-porto', countryIso2: 'PT', name: 'Porto', location: { lat: 41.1579, lng: -8.6291 } },
  { id: 'city-braga', countryIso2: 'PT', name: 'Braga', location: { lat: 41.5454, lng: -8.4265 } },
  { id: 'city-coimbra', countryIso2: 'PT', name: 'Coimbra', location: { lat: 40.2033, lng: -8.4103 } },
  { id: 'city-faro', countryIso2: 'PT', name: 'Faro', location: { lat: 37.0194, lng: -7.9304 } },
  { id: 'city-aveiro', countryIso2: 'PT', name: 'Aveiro', location: { lat: 40.6405, lng: -8.6538 } },

  // Spain
  { id: 'city-madrid', countryIso2: 'ES', name: 'Madrid', isCapital: true, location: { lat: 40.4168, lng: -3.7038 } },
  { id: 'city-barcelona', countryIso2: 'ES', name: 'Barcelona', location: { lat: 41.3851, lng: 2.1734 } },
  { id: 'city-valencia', countryIso2: 'ES', name: 'Valencia', location: { lat: 39.4699, lng: -0.3763 } },
  { id: 'city-sevilla', countryIso2: 'ES', name: 'Sevilla', location: { lat: 37.3886, lng: -5.9823 } },
  { id: 'city-malaga', countryIso2: 'ES', name: 'Málaga', location: { lat: 36.7213, lng: -4.4214 } },
  { id: 'city-bilbao', countryIso2: 'ES', name: 'Bilbao', location: { lat: 43.263, lng: -2.935 } },
  { id: 'city-algeciras', countryIso2: 'ES', name: 'Algeciras', location: { lat: 36.1408, lng: -5.4562 } },

  // Brazil
  { id: 'city-brasilia', countryIso2: 'BR', name: 'Brasília', isCapital: true, location: { lat: -15.7939, lng: -47.8828 } },
  { id: 'city-sao-paulo', countryIso2: 'BR', name: 'São Paulo', location: { lat: -23.5505, lng: -46.6333 } },
  { id: 'city-rio-de-janeiro', countryIso2: 'BR', name: 'Rio de Janeiro', location: { lat: -22.9068, lng: -43.1729 } },
  { id: 'city-fortaleza', countryIso2: 'BR', name: 'Fortaleza', location: { lat: -3.7319, lng: -38.5267 } },
  { id: 'city-recife', countryIso2: 'BR', name: 'Recife', location: { lat: -8.0476, lng: -34.877 } },
  { id: 'city-salvador', countryIso2: 'BR', name: 'Salvador', location: { lat: -12.9714, lng: -38.5014 } },
  { id: 'city-belo-horizonte', countryIso2: 'BR', name: 'Belo Horizonte', location: { lat: -19.9167, lng: -43.9345 } },
  { id: 'city-curitiba', countryIso2: 'BR', name: 'Curitiba', location: { lat: -25.4284, lng: -49.2733 } },
  { id: 'city-porto-alegre', countryIso2: 'BR', name: 'Porto Alegre', location: { lat: -30.0346, lng: -51.2177 } },
];

export function citiesByCountry(iso2: string): SeedCity[] {
  return seedCities.filter((c) => c.countryIso2 === iso2);
}

export function findCity(id: string): SeedCity | undefined {
  return seedCities.find((c) => c.id === id);
}
