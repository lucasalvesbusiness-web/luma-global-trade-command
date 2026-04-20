'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl, { type Map as MapboxMap, type Marker } from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

import { useCanvasStore } from '@/lib/canvas/store';
import { seedOrigins, valeDoSaoFranciscoCenter } from '@/data/seed/origins';
import { findPort } from '@/data/seed/ports';
import { logisticsRoutes, valePois } from '@/data/seed/vale-pois';
import { fieldPlots, plotsForProduct } from '@/data/seed/field-plots';
import { getProductMedia } from '@/data/seed/product-media';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const STYLE = 'mapbox://styles/mapbox/outdoors-v12';

type Props = {
  onReady?: () => void;
};

/**
 * Mapa do Vale do São Francisco — full screen, 3D terrain, rotas, origens,
 * POIs e lotes (field plots) renderizados como polígonos GeoJSON.
 *
 * Dispara onReady quando o mapa + estilo estão carregados (para o shell
 * poder revelar ProductRail / LoadPlanTray).
 */
export function ValeMap({ onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const plotPopupsRef = useRef<mapboxgl.Popup[]>([]);
  const plotPhotoCyclerRef = useRef<number | null>(null);
  const styleLoadedRef = useRef(false);
  const [tokenMissing, setTokenMissing] = useState(false);

  const selectedProductSlug = useCanvasStore((s) => s.selectedProductSlug);

  // Inicializa
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
      center: [valeDoSaoFranciscoCenter.lng, valeDoSaoFranciscoCenter.lat],
      zoom: 7.5,
      pitch: 0,
      bearing: 0,
      antialias: true,
      attributionControl: false,
      dragRotate: true,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'bottom-right',
    );

    map.on('style.load', () => {
      styleLoadedRef.current = true;

      map.setFog({
        color: 'rgba(247, 244, 238, 0.92)',
        'high-color': 'rgb(232, 221, 199)',
        'horizon-blend': 0.05,
        'space-color': 'rgb(232, 221, 199)',
        'star-intensity': 0,
      });

      // Terreno 3D
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.3 });

      if (!map.getLayer('sky')) {
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 12,
          },
        });
      }

      // ---- Rotas logísticas ----
      const routesGeo = {
        type: 'FeatureCollection' as const,
        features: logisticsRoutes.map((r) => ({
          type: 'Feature' as const,
          properties: { id: r.id, label: r.labelEn },
          geometry: { type: 'LineString' as const, coordinates: r.coordinates },
        })),
      };
      if (!map.getSource('luma-routes')) {
        map.addSource('luma-routes', { type: 'geojson', data: routesGeo });
        map.addLayer({
          id: 'luma-routes-casing',
          type: 'line',
          source: 'luma-routes',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#F7F4EE', 'line-width': 4, 'line-opacity': 0.55 },
        });
        map.addLayer({
          id: 'luma-routes-line',
          type: 'line',
          source: 'luma-routes',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#E6A84C',
            'line-width': 2,
            'line-opacity': 0.9,
            'line-dasharray': [2, 1.4],
          },
        });
      }

      // ---- Field plots (lotes) ----
      // Mapbox feature-state requer `id` no topo da feature (não em properties).
      // Usamos o índice numérico como id; referência pelo array original.
      const plotsGeo = {
        type: 'FeatureCollection' as const,
        features: fieldPlots.map((p, idx) => ({
          type: 'Feature' as const,
          id: idx,
          properties: {
            plotId: p.id,
            productSlug: p.productSlug,
            label: p.label,
            status: p.status,
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [p.polygon],
          },
        })),
      };
      if (!map.getSource('luma-plots')) {
        map.addSource('luma-plots', { type: 'geojson', data: plotsGeo });

        // Fill — varia por status (positive/pending/info)
        map.addLayer({
          id: 'luma-plots-fill',
          type: 'fill',
          source: 'luma-plots',
          paint: {
            'fill-color': [
              'match',
              ['get', 'status'],
              'PRODUCING',
              '#7A9A5E',
              'NEXT_HARVEST',
              '#E6A84C',
              'RESTING',
              '#E8DDC7',
              'AUDIT',
              '#8B6B4A',
              '#556B2F',
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'highlighted'], false],
              0.75,
              ['boolean', ['feature-state', 'dimmed'], false],
              0.12,
              0.42,
            ],
          },
        });
        map.addLayer({
          id: 'luma-plots-outline',
          type: 'line',
          source: 'luma-plots',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'highlighted'], false],
              '#2A2E27',
              '#556B2F',
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'highlighted'], false],
              2,
              1,
            ],
            'line-opacity': [
              'case',
              ['boolean', ['feature-state', 'dimmed'], false],
              0.25,
              0.8,
            ],
          },
        });
      }

      // Fly-to cinematográfico pro Vale
      map.flyTo({
        center: [valeDoSaoFranciscoCenter.lng, valeDoSaoFranciscoCenter.lat],
        zoom: 9.4,
        pitch: 55,
        bearing: -12,
        duration: 2600,
        curve: 1.5,
        essential: true,
      });

      // ---- Origens Luma ----
      for (const origin of seedOrigins) {
        const el = document.createElement('div');
        el.className = 'luma-origin-marker';
        el.dataset.kind = origin.kind;
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([origin.location.lng, origin.location.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 18, closeButton: false, className: 'luma-popup' }).setHTML(
              `<div class="luma-popup-inner">
                <span class="luma-popup-kind">${origin.kind.replace('_', ' ').toLowerCase()}</span>
                <strong>${origin.name}</strong>
                <p>${origin.statusBlurbPtBr}</p>
              </div>`,
            ),
          )
          .addTo(map);
        markersRef.current.push(marker);
      }

      // ---- POIs ----
      for (const poi of valePois) {
        const el = document.createElement('div');
        el.className = 'luma-poi-marker';
        el.dataset.kind = poi.kind;
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([poi.location.lng, poi.location.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 14, closeButton: false, className: 'luma-popup' }).setHTML(
              `<div class="luma-popup-inner">
                <strong>${poi.namePtBr}</strong>
                <p>${poi.blurbPtBr}</p>
              </div>`,
            ),
          )
          .addTo(map);
        markersRef.current.push(marker);
      }

      // ---- Portos de escoamento ----
      const highlighted = ['port-pecem', 'port-suape', 'port-santos']
        .map(findPort)
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
      for (const port of highlighted) {
        const el = document.createElement('div');
        el.className = 'luma-port-marker';
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([port.location.lng, port.location.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 14, closeButton: false, className: 'luma-popup' }).setHTML(
              `<div class="luma-popup-inner">
                <strong>${port.name}</strong>
                <p>${port.code}</p>
              </div>`,
            ),
          )
          .addTo(map);
        markersRef.current.push(marker);
      }

      // Sinaliza ao shell que o mapa está pronto para receber overlays
      onReady?.();
    });

    const markersNow = markersRef.current;
    return () => {
      for (const m of markersNow) m.remove();
      markersNow.length = 0;
      styleLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza feature-state + popups ancorados em cada lote quando selectedProductSlug muda
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const run = () => {
      // 1) highlight/dim dos polígonos
      fieldPlots.forEach((plot, idx) => {
        const match = selectedProductSlug && plot.productSlug === selectedProductSlug;
        map.setFeatureState(
          { source: 'luma-plots', id: idx },
          { highlighted: match, dimmed: Boolean(selectedProductSlug && !match) },
        );
      });

      // 2) Limpa popups anteriores e o cycler de fotos
      for (const p of plotPopupsRef.current) p.remove();
      plotPopupsRef.current = [];
      if (plotPhotoCyclerRef.current !== null) {
        window.clearInterval(plotPhotoCyclerRef.current);
        plotPhotoCyclerRef.current = null;
      }

      if (!selectedProductSlug) return;

      const plots = plotsForProduct(selectedProductSlug);
      const media = getProductMedia(selectedProductSlug);

      if (plots.length === 0) return;

      // 3) Cria um popup por lote. Um deles ganha o vídeo (se houver).
      //    Cada popup-foto recebe TODAS as fotos como <img> empilhadas,
      //    controladas por `data-active` — cycler altera ciclicamente.
      const photos = media?.photos ?? [];
      const videoSrc = media?.video;
      let videoAssignedIndex = -1;

      // Anchors alternados — evita que todos os popups apontem pra baixo
      // e se empilhem verticalmente quando os lotes estão próximos.
      const anchors: Array<
        'bottom' | 'top' | 'left' | 'right' | 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
      > = [
        'bottom',
        'top',
        'left',
        'right',
        'bottom-left',
        'top-right',
        'bottom-right',
        'top-left',
      ];

      plots.forEach((plot, i) => {
        const el = document.createElement('div');
        const hasVideo = videoSrc && videoAssignedIndex === -1 && i === 0;
        if (hasVideo) videoAssignedIndex = i;

        el.className = hasVideo
          ? 'luma-plot-popup-card luma-plot-popup-card--video'
          : 'luma-plot-popup-card';
        el.style.animationDelay = `${i * 140}ms`;

        if (hasVideo) {
          const video = document.createElement('video');
          video.src = videoSrc!;
          video.autoplay = true;
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          video.className = 'luma-plot-popup-card__video';
          // Ajusta o card ao aspecto nativo do vídeo quando os metadados carregam
          video.addEventListener('loadedmetadata', () => {
            const { videoWidth, videoHeight } = video;
            if (!videoWidth || !videoHeight) return;
            const isPortrait = videoHeight > videoWidth;
            if (isPortrait) {
              el.style.width = '118px';
              el.style.height = '180px';
            } else {
              el.style.width = '200px';
              el.style.height = '124px';
            }
          });
          el.appendChild(video);
          const badge = document.createElement('span');
          badge.className = 'luma-plot-popup-card__badge';
          badge.textContent = 'Campo · vídeo';
          el.appendChild(badge);
        } else if (photos.length > 0) {
          photos.forEach((src, idxPhoto) => {
            const img = document.createElement('img');
            img.src = src;
            img.loading = 'lazy';
            img.alt = plot.label;
            img.className = 'luma-plot-popup-card__img';
            img.dataset.active = idxPhoto === i % photos.length ? 'true' : 'false';
            el.appendChild(img);
          });
          const badge = document.createElement('span');
          badge.className = 'luma-plot-popup-card__badge';
          badge.textContent = plot.label.split('—')[1]?.trim() ?? plot.label;
          el.appendChild(badge);
        } else {
          // Sem mídia: badge com nome do lote
          const badge = document.createElement('span');
          badge.className = 'luma-plot-popup-card__badge';
          badge.textContent = plot.label;
          el.appendChild(badge);
        }

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          closeOnMove: false,
          className: 'luma-plot-popup',
          offset: 14,
          anchor: anchors[i % anchors.length]!,
        })
          .setLngLat(plot.centroid)
          .setDOMContent(el)
          .addTo(map);
        plotPopupsRef.current.push(popup);
      });

      // 4) Cicler de fotos — troca a foto ativa em cada popup a cada 3s
      if (photos.length > 1) {
        let tick = 0;
        plotPhotoCyclerRef.current = window.setInterval(() => {
          tick += 1;
          plotPopupsRef.current.forEach((popup, popupIdx) => {
            if (popupIdx === videoAssignedIndex) return;
            const popupEl = popup.getElement();
            if (!popupEl) return;
            const el = popupEl.querySelector('.luma-plot-popup-card');
            if (!el) return;
            const imgs = el.querySelectorAll<HTMLImageElement>(
              '.luma-plot-popup-card__img',
            );
            const activeIdx = (popupIdx + tick) % photos.length;
            imgs.forEach((img, idx) => {
              img.dataset.active = idx === activeIdx ? 'true' : 'false';
            });
          });
        }, 3200);
      }
    };

    if (styleLoadedRef.current) run();
    else map.once('style.load', run);
  }, [selectedProductSlug]);

  // Escala dos popups conforme zoom do mapa. Menor em zoom out, maior em zoom in.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyScale = () => {
      const z = map.getZoom();
      // zoom 7 (longe) → 0.55;  zoom 9 (default) → 0.75;
      // zoom 11 → 0.95;         zoom 13+ (perto) → 1.15
      const scale = Math.max(0.55, Math.min(1.15, (z - 7) * 0.1 + 0.55));
      plotPopupsRef.current.forEach((popup) => {
        const card = popup
          .getElement()
          ?.querySelector<HTMLElement>('.luma-plot-popup-card');
        if (card) card.style.transform = `scale(${scale.toFixed(2)})`;
      });
    };

    applyScale();
    map.on('zoom', applyScale);
    map.on('zoomend', applyScale);

    return () => {
      map.off('zoom', applyScale);
      map.off('zoomend', applyScale);
    };
  }, [selectedProductSlug]);

  // Cleanup geral ao desmontar
  useEffect(() => {
    const popupsNow = plotPopupsRef.current;
    const cyclerNow = plotPhotoCyclerRef;
    return () => {
      for (const p of popupsNow) p.remove();
      popupsNow.length = 0;
      if (cyclerNow.current !== null) {
        window.clearInterval(cyclerNow.current);
        cyclerNow.current = null;
      }
    };
  }, []);

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
