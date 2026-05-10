'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

import { useDiscoveryStore } from '@/lib/discovery/store';
import type { DiscoveryResult } from '@/server/trpc/routers/discovery';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type Props = {
  companies: DiscoveryResult[];
  className?: string;
};

export function DiscoveryMap({ companies, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const { hoveredId, selectedId, setHover, setSelected } = useDiscoveryStore();

  useEffect(() => {
    if (!containerRef.current) return;
    if (!TOKEN) {
      containerRef.current.innerHTML =
        '<div class="flex h-full w-full items-center justify-center text-xs text-ink-400">Defina NEXT_PUBLIC_MAPBOX_TOKEN para ver o mapa.</div>';
      return;
    }

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-46.633, -23.55],
      zoom: 4,
      attributionControl: false,
      cooperativeGestures: true,
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    for (const marker of markersRef.current.values()) marker.remove();
    markersRef.current.clear();

    const positioned = companies.filter(
      (c) => c.latitude !== null && c.longitude !== null,
    );

    if (positioned.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    for (const c of positioned) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className =
        'h-3 w-3 rounded-full border border-white/40 transition-transform hover:scale-150 cursor-pointer';
      el.style.background = '#D0D0D0';
      el.dataset.companyId = c.id;
      el.addEventListener('mouseenter', () => setHover(c.id));
      el.addEventListener('mouseleave', () => setHover(null));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelected(c.id);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([c.longitude!, c.latitude!])
        .addTo(map);
      markersRef.current.set(c.id, marker);
      bounds.extend([c.longitude!, c.latitude!]);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 11 });
    }
  }, [companies, setHover, setSelected]);

  // Sync hover/selected styling from store back to DOM markers.
  useEffect(() => {
    for (const [id, marker] of markersRef.current.entries()) {
      const el = marker.getElement();
      const isActive = id === hoveredId || id === selectedId;
      el.style.transform = isActive ? 'scale(1.4)' : '';
      el.style.background = id === selectedId ? '#E5C893' : '#D0D0D0';
    }
  }, [hoveredId, selectedId]);

  return (
    <div
      ref={containerRef}
      className={className ?? 'h-full w-full overflow-hidden rounded-md bg-ink-900'}
    />
  );
}
