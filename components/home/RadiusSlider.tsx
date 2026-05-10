'use client';

import { RADIUS_OPTIONS_KM, useHomeStore, type RadiusKm } from '@/lib/home/store';
import { TechLabel } from '@/components/ui/TechLabel';
import { cn } from '@/lib/utils';

function format(km: RadiusKm) {
  if (km >= 1000) return `${km / 1000}k km`;
  return `${km} km`;
}

export function RadiusSlider() {
  const radiusKm = useHomeStore((s) => s.radiusKm);
  const setRadius = useHomeStore((s) => s.setRadius);

  return (
    <div
      role="radiogroup"
      aria-label="Raio de visualização"
      className="surface-graphite pointer-events-auto inline-flex items-center gap-2 rounded-md border border-white/[0.08] px-3 py-2 shadow-lg backdrop-blur"
    >
      <TechLabel>Raio</TechLabel>
      <div className="flex gap-1">
        {RADIUS_OPTIONS_KM.map((km) => {
          const active = radiusKm === km;
          return (
            <button
              key={km}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRadius(km)}
              className={cn(
                'rounded-sm border px-2 py-1 text-[10px] uppercase tracking-wider transition-colors',
                active
                  ? 'border-amber/60 bg-amber/15 text-amber-glow'
                  : 'border-white/10 text-ink-300 hover:border-white/25 hover:text-ink-100',
              )}
            >
              {format(km)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
