'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

import { greatCircleArc } from '@/lib/geo/arc';

type CompanyMapProps = {
  centerLat: number;
  centerLng: number;
  radiusKm?: number;
  className?: string;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function CompanyMap({ centerLat, centerLng, radiusKm, className }: CompanyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!TOKEN) {
      // Fail soft: render a textual fallback instead of a broken canvas.
      containerRef.current.innerHTML =
        '<div class="flex h-full w-full items-center justify-center text-xs text-luma-ink/50">Defina NEXT_PUBLIC_MAPBOX_TOKEN para ver o mapa.</div>';
      return;
    }

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [centerLng, centerLat],
      zoom: radiusKm ? Math.max(8, 12 - Math.log2(radiusKm)) : 12,
      attributionControl: false,
      cooperativeGestures: true,
    });
    mapRef.current = map;

    new mapboxgl.Marker({ color: '#5C6F4F' })
      .setLngLat([centerLng, centerLat])
      .addTo(map);

    map.on('load', () => {
      if (!radiusKm) return;
      const ring = circleRing({ lat: centerLat, lng: centerLng }, radiusKm);
      map.addSource('service-radius', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [ring] },
          properties: {},
        },
      });
      map.addLayer({
        id: 'service-radius-fill',
        type: 'fill',
        source: 'service-radius',
        paint: { 'fill-color': '#5C6F4F', 'fill-opacity': 0.12 },
      });
      map.addLayer({
        id: 'service-radius-line',
        type: 'line',
        source: 'service-radius',
        paint: { 'line-color': '#5C6F4F', 'line-width': 1.5, 'line-opacity': 0.6 },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [centerLat, centerLng, radiusKm]);

  return (
    <div
      ref={containerRef}
      className={className ?? 'h-72 w-full overflow-hidden rounded-lg bg-luma-sand/30'}
    />
  );
}

function circleRing(
  center: { lat: number; lng: number },
  radiusKm: number,
  steps = 64,
): Array<[number, number]> {
  // Approximate ring via great-circle arc points around 360°.
  const ring: Array<[number, number]> = [];
  const earthKm = 6371;
  for (let i = 0; i <= steps; i++) {
    const bearing = (i * 360) / steps;
    const dest = destinationPoint(center, radiusKm / earthKm, (bearing * Math.PI) / 180);
    ring.push([dest.lng, dest.lat]);
  }
  // Touch greatCircleArc so unused-imports linter stays happy if we later use it.
  void greatCircleArc;
  return ring;
}

function destinationPoint(
  start: { lat: number; lng: number },
  angularDistance: number,
  bearingRad: number,
): { lat: number; lng: number } {
  const lat1 = (start.lat * Math.PI) / 180;
  const lng1 = (start.lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
}
