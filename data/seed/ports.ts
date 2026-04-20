import type { LatLng } from '@/lib/canvas/types';

export type SeedPort = {
  id: string;
  countryIso2: string;
  name: string;
  code: string; // UN/LOCODE
  location: LatLng;
};

export const seedPorts: SeedPort[] = [
  // Netherlands
  { id: 'port-rotterdam', countryIso2: 'NL', name: 'Rotterdam', code: 'NLRTM', location: { lat: 51.9225, lng: 4.4792 } },
  { id: 'port-amsterdam', countryIso2: 'NL', name: 'Amsterdam', code: 'NLAMS', location: { lat: 52.3847, lng: 4.8965 } },
  { id: 'port-vlissingen', countryIso2: 'NL', name: 'Vlissingen', code: 'NLVLI', location: { lat: 51.4416, lng: 3.5704 } },

  // United Arab Emirates
  { id: 'port-jebel-ali', countryIso2: 'AE', name: 'Jebel Ali', code: 'AEJEA', location: { lat: 25.0152, lng: 55.0631 } },
  { id: 'port-khalifa', countryIso2: 'AE', name: 'Khalifa', code: 'AEKHL', location: { lat: 24.8264, lng: 54.6503 } },
  { id: 'port-fujairah', countryIso2: 'AE', name: 'Fujairah', code: 'AEFJR', location: { lat: 25.1564, lng: 56.3517 } },
  { id: 'port-sharjah', countryIso2: 'AE', name: 'Sharjah', code: 'AESHJ', location: { lat: 25.3672, lng: 55.3742 } },

  // United States
  { id: 'port-miami', countryIso2: 'US', name: 'Miami', code: 'USMIA', location: { lat: 25.7747, lng: -80.1767 } },
  { id: 'port-houston', countryIso2: 'US', name: 'Houston', code: 'USHOU', location: { lat: 29.7263, lng: -95.2575 } },
  { id: 'port-los-angeles', countryIso2: 'US', name: 'Los Angeles', code: 'USLAX', location: { lat: 33.7395, lng: -118.2588 } },
  { id: 'port-ny-nj', countryIso2: 'US', name: 'New York / New Jersey', code: 'USNYC', location: { lat: 40.6895, lng: -74.0451 } },
  { id: 'port-philadelphia', countryIso2: 'US', name: 'Philadelphia', code: 'USPHL', location: { lat: 39.9336, lng: -75.1418 } },
  { id: 'port-jacksonville', countryIso2: 'US', name: 'Jacksonville', code: 'USJAX', location: { lat: 30.3892, lng: -81.5878 } },
  { id: 'port-savannah', countryIso2: 'US', name: 'Savannah', code: 'USSAV', location: { lat: 32.1265, lng: -81.1428 } },

  // Portugal
  { id: 'port-leixoes', countryIso2: 'PT', name: 'Leixões', code: 'PTLEI', location: { lat: 41.1833, lng: -8.7 } },
  { id: 'port-lisboa', countryIso2: 'PT', name: 'Lisboa', code: 'PTLIS', location: { lat: 38.7071, lng: -9.1397 } },
  { id: 'port-sines', countryIso2: 'PT', name: 'Sines', code: 'PTSIE', location: { lat: 37.9561, lng: -8.8821 } },
  { id: 'port-setubal', countryIso2: 'PT', name: 'Setúbal', code: 'PTSET', location: { lat: 38.5244, lng: -8.8907 } },

  // Spain
  { id: 'port-valencia', countryIso2: 'ES', name: 'Valencia', code: 'ESVLC', location: { lat: 39.4514, lng: -0.3208 } },
  { id: 'port-barcelona', countryIso2: 'ES', name: 'Barcelona', code: 'ESBCN', location: { lat: 41.3497, lng: 2.1684 } },
  { id: 'port-algeciras', countryIso2: 'ES', name: 'Algeciras', code: 'ESALG', location: { lat: 36.1279, lng: -5.4374 } },
  { id: 'port-bilbao', countryIso2: 'ES', name: 'Bilbao', code: 'ESBIO', location: { lat: 43.3502, lng: -3.0517 } },

  // Brazil
  { id: 'port-santos', countryIso2: 'BR', name: 'Santos', code: 'BRSSZ', location: { lat: -23.9608, lng: -46.3333 } },
  { id: 'port-pecem', countryIso2: 'BR', name: 'Pecém', code: 'BRPEC', location: { lat: -3.5407, lng: -38.7987 } },
  { id: 'port-suape', countryIso2: 'BR', name: 'Suape', code: 'BRSUA', location: { lat: -8.3956, lng: -34.9708 } },
  { id: 'port-salvador', countryIso2: 'BR', name: 'Salvador', code: 'BRSSA', location: { lat: -12.9704, lng: -38.5086 } },
  { id: 'port-paranagua', countryIso2: 'BR', name: 'Paranaguá', code: 'BRPNG', location: { lat: -25.5086, lng: -48.5122 } },
  { id: 'port-itapoa', countryIso2: 'BR', name: 'Itapoá', code: 'BRIOA', location: { lat: -26.1111, lng: -48.6189 } },
  { id: 'port-rio-de-janeiro', countryIso2: 'BR', name: 'Rio de Janeiro', code: 'BRRIO', location: { lat: -22.8942, lng: -43.1847 } },
  { id: 'port-vitoria', countryIso2: 'BR', name: 'Vitória', code: 'BRVIX', location: { lat: -20.3155, lng: -40.3128 } },
];

export function portsByCountry(iso2: string): SeedPort[] {
  return seedPorts.filter((p) => p.countryIso2 === iso2);
}

export function findPort(id: string): SeedPort | undefined {
  return seedPorts.find((p) => p.id === id);
}
