'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl, { type Map as MapboxMap, type Marker } from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

import { useCanvasStore } from '@/lib/canvas/store';
import { seedCountries } from '@/data/seed/countries';
import { findCity } from '@/data/seed/cities';
import { findPort } from '@/data/seed/ports';
import type { DestinationDraft } from '@/lib/canvas/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

type CameraTarget = {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
  duration: number;
  curve?: number;
};

function calcTarget(destination: DestinationDraft): CameraTarget {
  if (!destination.countryIso2) {
    return { center: [-30, 10], zoom: 1.5, pitch: 0, bearing: 0, duration: 0 };
  }
  const port = destination.portId ? findPort(destination.portId) : null;
  const city = destination.cityId ? findCity(destination.cityId) : null;
  const country = seedCountries.find((c) => c.iso2 === destination.countryIso2);

  if (port) {
    return {
      center: [port.location.lng, port.location.lat],
      zoom: 10.5,
      pitch: 40,
      bearing: 0,
      duration: 2400,
      curve: 1.45,
    };
  }
  if (city) {
    return {
      center: [city.location.lng, city.location.lat],
      zoom: 8.5,
      pitch: 25,
      bearing: 0,
      duration: 2200,
      curve: 1.45,
    };
  }
  return {
    center: [country!.centroid.lng, country!.centroid.lat],
    zoom: 4.2,
    pitch: 0,
    bearing: 0,
    duration: 2400,
    curve: 1.4,
  };
}

export function GlobeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const styleLoadedRef = useRef(false);
  const [tokenMissing, setTokenMissing] = useState(false);

  const destination = useCanvasStore((s) => s.destination);
  const setCountry = useCanvasStore((s) => s.setCountry);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.replace_me') {
      setTokenMissing(true);
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [-30, 10],
      zoom: 1.5,
      projection: { name: 'globe' },
      pitch: 0,
      bearing: 0,
      antialias: true,
      attributionControl: false,
      dragRotate: true,
      renderWorldCopies: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    map.on('style.load', () => {
      styleLoadedRef.current = true;

      // Fog claro Luma — coerente com o fundo institucional
      map.setFog({
        color: 'rgb(247, 244, 238)',
        'high-color': 'rgb(62, 124, 158)',
        'horizon-blend': 0.04,
        'space-color': 'rgb(232, 221, 199)', // sand — respiro natural, NÃO preto
        'star-intensity': 0.1,
      });

      // Country markers
      const selectedIso = useCanvasStore.getState().destination.countryIso2;
      for (const country of seedCountries) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'luma-country-marker';
        el.dataset.iso = country.iso2;
        el.dataset.selected = selectedIso === country.iso2 ? 'true' : 'false';
        el.setAttribute('aria-label', country.name);
        el.innerHTML = `<span class="luma-country-marker__flag">${country.flagEmoji}</span>`;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setCountry(country.iso2);
        });
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([country.centroid.lng, country.centroid.lat])
          .addTo(map);
        markersRef.current.set(country.iso2, marker);
      }
    });

    const markersNow = markersRef.current;
    return () => {
      for (const m of markersNow.values()) m.remove();
      markersNow.clear();
      styleLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza seleção do país no visual dos markers
  useEffect(() => {
    for (const [iso, marker] of markersRef.current) {
      marker.getElement().dataset.selected =
        iso === destination.countryIso2 ? 'true' : 'false';
    }
  }, [destination.countryIso2]);

  // Câmera fly-to conforme destino é preenchido
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const run = () => {
      const t = calcTarget(destination);
      if (t.duration === 0) return;
      map.flyTo({
        center: t.center,
        zoom: t.zoom,
        pitch: t.pitch ?? 0,
        bearing: t.bearing ?? 0,
        duration: t.duration,
        curve: t.curve ?? 1.4,
        essential: true,
      });
    };
    if (styleLoadedRef.current) run();
    else map.once('style.load', run);
  }, [destination]);

  if (tokenMissing) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-luma-sand/40 p-6 text-center">
        <p className="max-w-xs text-sm text-luma-ink/60">
          Defina <code className="mx-1 rounded bg-white/70 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> no{' '}
          <code className="rounded bg-white/70 px-1">.env</code> e reinicie.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
