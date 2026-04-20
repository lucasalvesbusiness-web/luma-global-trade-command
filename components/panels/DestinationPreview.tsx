'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Anchor, Building2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { useCanvasStore } from '@/lib/canvas/store';
import { staticImageUrl } from '@/lib/mapbox/static';
import { cn } from '@/lib/utils';
import { findCity } from '@/data/seed/cities';
import { findPort } from '@/data/seed/ports';

function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${ns}  ·  ${Math.abs(lng).toFixed(2)}° ${ew}`;
}

export function DestinationPreview() {
  const locale = useLocale();
  const t = useTranslations('destinationPreview');

  const { stage, destination } = useCanvasStore();
  const city = destination.cityId ? findCity(destination.cityId) : null;
  const port = destination.portId ? findPort(destination.portId) : null;

  const visible =
    (stage === 'intro' || stage === 'destinationSelection') && (Boolean(city) || Boolean(port));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="dest-preview"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'fixed z-20 flex flex-col gap-3',
            // Coluna direita (sobre o globo), empilhado do topo
            'right-6 top-24 md:right-10 md:top-28',
            'w-[min(300px,calc(50vw-3rem))]',
          )}
        >
          {city && (
            <PreviewCard
              icon={<Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
              kindLabel={t('city')}
              name={city.name}
              sublabel={formatCoord(city.location.lat, city.location.lng)}
              caption={city.isCapital ? (locale === 'pt-br' ? 'Capital' : 'Capital') : null}
              imageUrl={staticImageUrl({
                location: city.location,
                zoom: 11,
                pitch: 30,
              })}
            />
          )}
          {port && (
            <PreviewCard
              icon={<Anchor className="h-3.5 w-3.5" strokeWidth={1.5} />}
              kindLabel={t('port')}
              name={port.name}
              sublabel={`${port.code}  ·  ${formatCoord(port.location.lat, port.location.lng)}`}
              caption={locale === 'pt-br' ? 'Porto de desembarque' : 'Landing port'}
              imageUrl={staticImageUrl({
                location: port.location,
                zoom: 13,
                pitch: 45,
                style: 'satellite-v9',
              })}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PreviewCard({
  icon,
  kindLabel,
  name,
  sublabel,
  caption,
  imageUrl,
}: {
  icon: React.ReactNode;
  kindLabel: string;
  name: string;
  sublabel: string;
  caption?: string | null;
  imageUrl: string;
}) {
  return (
    <div className="luma-glass overflow-hidden rounded-xl shadow-xl shadow-black/10">
      <div className="relative aspect-[16/9] w-full bg-luma-sand/40">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {caption && (
          <span className="absolute bottom-2 left-3 rounded-md bg-black/30 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.22em] text-white/90 backdrop-blur-sm">
            {caption}
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.22em] text-luma-olive/80">
          {icon}
          <span>{kindLabel}</span>
        </div>
        <p className="mt-1 font-display text-lg font-light leading-tight text-luma-ink">
          {name}
        </p>
        <p className="mt-0.5 font-mono text-[0.68rem] text-luma-ink/55">{sublabel}</p>
      </div>
    </div>
  );
}
