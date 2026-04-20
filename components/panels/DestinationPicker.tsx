'use client';

import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { useCanvasStore } from '@/lib/canvas/store';
import {
  incoterms,
  volumeBands,
  type Incoterm,
  type VolumeBand,
} from '@/lib/canvas/types';
import { cn } from '@/lib/utils';
import { seedCountries } from '@/data/seed/countries';
import { portsByCountry } from '@/data/seed/ports';
import { citiesByCountry } from '@/data/seed/cities';

const fieldCls =
  'w-full rounded-md border border-black/10 bg-white/70 px-3 py-2 text-sm text-luma-ink shadow-sm outline-none transition focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';

const labelCls =
  'text-[0.62rem] uppercase tracking-[0.22em] text-luma-olive/80 font-medium';

/**
 * DestinationPicker — painel EMBUTIDO (não flutuante).
 * Deve ser posicionado pelo layout pai (CanvasShell) abaixo do globo.
 */
export function DestinationPicker() {
  const locale = useLocale();
  const t = useTranslations('destinationPicker');

  const {
    stage,
    destination,
    setCountry,
    setPort,
    setCity,
    setIncoterm,
    setVolume,
    confirmDestination,
    isDestinationComplete,
  } = useCanvasStore();

  if (stage !== 'intro' && stage !== 'destinationSelection') return null;

  const availablePorts = destination.countryIso2
    ? portsByCountry(destination.countryIso2)
    : [];
  const availableCities = destination.countryIso2
    ? citiesByCountry(destination.countryIso2)
    : [];

  const countryName = (iso2: string) => {
    const c = seedCountries.find((x) => x.iso2 === iso2);
    if (!c) return iso2;
    return locale === 'pt-br' ? c.namePtBr : c.name;
  };

  return (
    <motion.aside
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="luma-glass rounded-2xl shadow-xl shadow-black/10 p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-luma-olive" strokeWidth={1.5} />
        <h2 className="font-display text-lg font-light text-luma-ink leading-none">
          {t('title')}
        </h2>
      </div>
      <p className="mb-4 text-[12.5px] leading-relaxed text-luma-ink/65">
        {t('subtitle')}
      </p>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          confirmDestination();
        }}
      >
        {/* País */}
        <div>
          <label className={labelCls} htmlFor="country">
            {t('country')}
          </label>
          <select
            id="country"
            className={cn(fieldCls, 'mt-1')}
            value={destination.countryIso2 ?? ''}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">{t('selectCountry')}</option>
            {seedCountries.map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {c.flagEmoji} {countryName(c.iso2)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Cidade */}
          <div>
            <label className={labelCls} htmlFor="city">
              {t('city')}
            </label>
            <select
              id="city"
              className={cn(fieldCls, 'mt-1')}
              value={destination.cityId ?? ''}
              onChange={(e) => setCity(e.target.value)}
              disabled={!destination.countryIso2}
            >
              <option value="">{t('selectCity')}</option>
              {availableCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isCapital ? ' ★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Porto */}
          <div>
            <label className={labelCls} htmlFor="port">
              {t('port')}
            </label>
            <select
              id="port"
              className={cn(fieldCls, 'mt-1')}
              value={destination.portId ?? ''}
              onChange={(e) => setPort(e.target.value)}
              disabled={!destination.countryIso2}
            >
              <option value="">{t('selectPort')}</option>
              {availablePorts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="incoterm">
              {t('incoterm')}
            </label>
            <select
              id="incoterm"
              className={cn(fieldCls, 'mt-1')}
              value={destination.incoterm ?? ''}
              onChange={(e) => setIncoterm(e.target.value as Incoterm)}
            >
              <option value="">—</option>
              {incoterms.map((ic) => (
                <option key={ic} value={ic}>
                  {ic}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="volume">
              {t('volume')}
            </label>
            <select
              id="volume"
              className={cn(fieldCls, 'mt-1')}
              value={destination.volume ?? ''}
              onChange={(e) => setVolume(e.target.value as VolumeBand)}
            >
              <option value="">—</option>
              {volumeBands.map((v) => (
                <option key={v.value} value={v.value}>
                  {locale === 'pt-br' ? v.labelPtBr : v.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isDestinationComplete()}
          className={cn(
            'group mt-2 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition',
            isDestinationComplete()
              ? 'bg-luma-olive text-luma-offwhite shadow-sm hover:brightness-110'
              : 'bg-luma-ink/10 text-luma-ink/40 cursor-not-allowed',
          )}
        >
          <span>{t('confirm')}</span>
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            strokeWidth={1.75}
          />
        </button>

        <p className="text-center text-[11px] text-luma-ink/55">{t('subjectLine')}</p>
      </form>
    </motion.aside>
  );
}
