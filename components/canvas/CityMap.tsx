'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

import { useHomeStore } from '@/lib/home/store';
import type { HomeCompany, HomeSelf } from '@/server/trpc/routers/home';
import { CompanyPopup } from '@/components/home/CompanyPopup';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type Props = {
  self: HomeSelf;
  companies: HomeCompany[];
  pitch?: number;
  className?: string;
};

export function CityMap({ self, companies, pitch = 60, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const selfMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [popupCompany, setPopupCompany] = useState<HomeCompany | null>(null);
  const [popupContainer, setPopupContainer] = useState<HTMLElement | null>(null);

  const { hoveredCompanyId, selectedCompanyId, setHovered, setSelected } = useHomeStore();

  // Initialize map once.
  useEffect(() => {
    if (!containerRef.current) return;
    if (!TOKEN) {
      containerRef.current.innerHTML =
        '<div class="flex h-full w-full items-center justify-center text-xs text-ink-400">Defina NEXT_PUBLIC_MAPBOX_TOKEN para ver o mapa.</div>';
      return;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Defensive: ensure container is empty before Mapbox claims it.
    // Strict mode double-invoke + HMR can leave stale DOM otherwise.
    containerRef.current.innerHTML = '';

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [self.lng, self.lat],
      zoom: 15.5,
      pitch: reduce ? 0 : pitch,
      bearing: 0,
      antialias: true,
      attributionControl: false,
      cooperativeGestures: true,
    });
    mapRef.current = map;

    map.on('load', () => {
      // 3D buildings layer (uses dark-v11 composite source).
      const layers = map.getStyle().layers;
      const firstSymbolId = layers.find((l) => l.type === 'symbol')?.id;

      if (!map.getLayer('lastro-buildings')) {
        map.addLayer(
          {
            id: 'lastro-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'height'],
                0,
                '#1a1a1a',
                20,
                '#222222',
                80,
                '#2a2a2a',
                200,
                '#333333',
              ],
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14,
                0,
                15.5,
                ['get', 'height'],
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14,
                0,
                15.5,
                ['get', 'min_height'],
              ],
              'fill-extrusion-opacity': 0.85,
            },
          },
          firstSymbolId,
        );
      }

      // Subtle fog for depth
      map.setFog({
        color: 'rgba(28, 28, 28, 0.85)',
        'high-color': '#0f0f0f',
        'horizon-blend': 0.15,
        'space-color': '#0f0f0f',
        'star-intensity': 0,
      });
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();
      selfMarkerRef.current?.remove();
      selfMarkerRef.current = null;
      // Defensive: clear any leftover DOM so HMR re-init doesn't warn.
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter when self changes (rarely).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    map.easeTo({
      center: [self.lng, self.lat],
      duration: reduce ? 0 : 800,
    });
  }, [self.lat, self.lng]);

  // Render / update self marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    selfMarkerRef.current?.remove();

    const el = document.createElement('div');
    el.className = 'lastro-self-marker';
    el.setAttribute('aria-label', `Sua empresa: ${self.name}`);
    el.innerHTML = `
      <span class="lastro-self-pulse"></span>
      <span class="lastro-self-core"></span>
      <span class="lastro-self-label">${escapeHtml(self.name)}</span>
    `;

    selfMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([self.lng, self.lat])
      .addTo(map);
  }, [self.lat, self.lng, self.name]);

  // Render markers for each company; rebuild on companies change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const m of markersRef.current.values()) m.remove();
    markersRef.current.clear();

    for (const c of companies) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'lastro-marker';
      el.setAttribute('data-connected', String(c.isConnected));
      el.setAttribute('data-watched', String(c.isWatched));
      el.setAttribute('aria-label', `${c.name} — clique para detalhes`);

      el.addEventListener('mouseenter', () => setHovered(c.id));
      el.addEventListener('mouseleave', () => setHovered(null));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelected(c.id);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([c.lng, c.lat])
        .addTo(map);
      markersRef.current.set(c.id, marker);
    }
  }, [companies, setHovered, setSelected]);

  // Highlight hovered marker.
  useEffect(() => {
    for (const [id, marker] of markersRef.current.entries()) {
      const el = marker.getElement();
      el.setAttribute('data-active', String(id === hoveredCompanyId));
    }
  }, [hoveredCompanyId]);

  // Open popup for selected.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    popupRef.current?.remove();
    popupRef.current = null;
    setPopupContainer(null);
    setPopupCompany(null);

    if (!selectedCompanyId) return;
    const target = companies.find((c) => c.id === selectedCompanyId);
    if (!target) return;

    const container = document.createElement('div');
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: true,
      offset: 18,
      anchor: 'bottom',
      className: 'lastro-popup',
      maxWidth: '320px',
    })
      .setLngLat([target.lng, target.lat])
      .setDOMContent(container)
      .addTo(map);

    popup.on('close', () => {
      setSelected(null);
    });

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    map.easeTo({
      center: [target.lng, target.lat],
      duration: reduce ? 0 : 600,
      offset: [0, -80],
    });

    popupRef.current = popup;
    setPopupContainer(container);
    setPopupCompany(target);
  }, [selectedCompanyId, companies, setSelected]);

  return (
    <>
      <div ref={containerRef} className={className ?? 'absolute inset-0'} />
      {popupCompany && popupContainer && (
        <CompanyPopup
          company={popupCompany}
          mountInto={popupContainer}
          selfHasOfferings={false}
        />
      )}
    </>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
