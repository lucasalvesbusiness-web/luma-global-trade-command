'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Container as ContainerIcon,
  FileText,
  Mail,
  MapPin,
  Package,
  Send,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useCanvasStore } from '@/lib/canvas/store';
import { findContainer } from '@/data/seed/containers';
import { findCity } from '@/data/seed/cities';
import { findPort } from '@/data/seed/ports';
import { seedCountries } from '@/data/seed/countries';
import { buyerCompanyTypes, type BuyerCompanyType } from '@/lib/canvas/types';
import { evaluateLoadPlan } from '@/lib/rules/load-plan';
import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

import { StatusChip } from '@/components/ui/StatusChip';

const fieldCls =
  'w-full rounded-md border border-black/10 bg-white/60 px-3 py-2 text-sm text-luma-ink shadow-sm outline-none transition focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';

const labelCls =
  'text-[0.6rem] uppercase tracking-[0.22em] text-luma-olive/80 font-medium';

export function ProposalReview() {
  const locale = useLocale();
  const t = useTranslations('review');

  const {
    reviewOpen,
    closeReview,
    destination,
    loadPlan,
    buyer,
    updateBuyer,
    submission,
    setSubmissionStatus,
    isBuyerComplete,
    clearLoadPlan,
    resetToIntro,
  } = useCanvasStore();

  const submitMutation = trpc.proposal.submit.useMutation();

  useEffect(() => {
    if (!reviewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && submission.status !== 'submitting') closeReview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reviewOpen, closeReview, submission.status]);

  const country = destination.countryIso2
    ? seedCountries.find((c) => c.iso2 === destination.countryIso2)
    : null;
  const city = destination.cityId ? findCity(destination.cityId) : null;
  const port = destination.portId ? findPort(destination.portId) : null;
  const container = loadPlan.containerCode ? findContainer(loadPlan.containerCode) : null;
  const evaluation = evaluateLoadPlan(loadPlan.containerCode, loadPlan.items);
  const hasCritical = evaluation.alerts.some((a) => a.severity === 'critical');

  const canSubmit =
    loadPlan.items.length > 0 &&
    Boolean(container) &&
    Boolean(country) &&
    isBuyerComplete() &&
    !hasCritical &&
    submission.status !== 'submitting';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmissionStatus({ status: 'submitting', reference: null, errorMessage: null });

    try {
      const result = await submitMutation.mutateAsync({
        destinationCountryIso2: country!.iso2,
        destinationPortId: port?.id ?? null,
        incoterm: destination.incoterm,
        buyer: {
          legalName: buyer.legalName.trim(),
          displayName: buyer.displayName?.trim() || null,
          type: buyer.type as BuyerCompanyType,
          countryIso2: country!.iso2,
          city: buyer.city?.trim() || city?.name || null,
          address: buyer.address?.trim() || null,
          contactName: buyer.contactName.trim(),
          contactEmail: buyer.contactEmail.trim().toLowerCase(),
          contactLocale: locale === 'pt-br' ? 'pt-br' : 'en',
        },
        container: {
          code: container!.code,
          configuredTempC: loadPlan.configuredTempC,
        },
        items: loadPlan.items.map((it) => ({
          productSlug: it.productSlug,
          varietyId: it.varietyId,
          qtyBoxes: it.qtyBoxes,
          qtyPallets: it.qtyPallets,
          totalWeightKg: it.qtyBoxes * it.boxWeightKg,
        })),
        buyerNote: buyer.buyerNote?.trim() || null,
      });

      setSubmissionStatus({
        status: 'submitted',
        reference: result.reference,
        errorMessage: null,
      });
      // Limpa o load plan depois do sucesso — o resumo vive no submission state
      clearLoadPlan();
    } catch (err) {
      setSubmissionStatus({
        status: 'error',
        reference: null,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleNewProposal = () => {
    setSubmissionStatus({ status: 'idle', reference: null, errorMessage: null });
    closeReview();
    resetToIntro();
  };

  return (
    <AnimatePresence>
      {reviewOpen && (
        <div key="review" className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label={t('close')}
            onClick={() => submission.status !== 'submitting' && closeReview()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-luma-ink/40 backdrop-blur-sm cursor-default"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto',
                'relative luma-glass rounded-2xl shadow-2xl shadow-black/20',
                'w-full max-w-[880px] max-h-[92vh] flex flex-col overflow-hidden',
                'bg-luma-offwhite/95',
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.32em] text-luma-olive/80">
                    {t('eyebrow')}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-light text-luma-ink leading-tight">
                    {submission.status === 'submitted' ? t('successTitle') : t('title')}
                  </h2>
                  <p className="mt-1 text-[12.5px] text-luma-ink/65">
                    {submission.status === 'submitted'
                      ? t('successSubtitle')
                      : t('subtitle')}
                  </p>
                </div>
                {submission.status !== 'submitting' && (
                  <button
                    onClick={
                      submission.status === 'submitted' ? handleNewProposal : closeReview
                    }
                    aria-label={t('close')}
                    className="rounded-full bg-white/60 p-2 text-luma-ink/70 shadow-sm transition hover:bg-white/90"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                )}
              </div>

              {/* Body */}
              {submission.status === 'submitted' ? (
                <SuccessState
                  reference={submission.reference!}
                  onNewProposal={handleNewProposal}
                />
              ) : (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Resumo do destino */}
                  <Section
                    icon={<MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />}
                    title={t('destination')}
                  >
                    <dl className="grid grid-cols-2 gap-3 text-[13px] md:grid-cols-4">
                      <Summary label={t('country')} value={country?.name ?? '—'} />
                      <Summary label={t('city')} value={city?.name ?? '—'} />
                      <Summary label={t('port')} value={port ? `${port.name} (${port.code})` : '—'} />
                      <Summary label={t('incoterm')} value={destination.incoterm ?? '—'} />
                    </dl>
                  </Section>

                  {/* Resumo do container + items */}
                  <Section
                    icon={<ContainerIcon className="h-3.5 w-3.5" strokeWidth={1.5} />}
                    title={t('container')}
                  >
                    {container ? (
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px] text-luma-ink/80">
                        <span className="font-medium text-luma-ink">
                          {locale === 'pt-br' ? container.displayNamePtBr : container.displayName}
                        </span>
                        <span className="tabular-nums">
                          {loadPlan.configuredTempC !== null
                            ? `${loadPlan.configuredTempC} °C`
                            : '—'}
                        </span>
                        <span className="font-mono tabular-nums">
                          {Math.round(evaluation.metrics.totalWeightKg).toLocaleString(locale)} kg
                        </span>
                        <span className="font-mono tabular-nums">
                          {evaluation.metrics.totalPallets} pal
                        </span>
                        <span className="font-mono tabular-nums">
                          {Math.round(evaluation.metrics.occupationPct * 100)}%
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-luma-ink/60">{t('noContainer')}</p>
                    )}
                  </Section>

                  <Section
                    icon={<Package className="h-3.5 w-3.5" strokeWidth={1.5} />}
                    title={t('loadItems')}
                  >
                    {loadPlan.items.length === 0 ? (
                      <p className="text-sm text-luma-ink/60">{t('noItems')}</p>
                    ) : (
                      <ul className="space-y-1.5 text-[13px]">
                        {loadPlan.items.map((it) => (
                          <li
                            key={it.localId}
                            className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-white/55 px-3 py-2 ring-1 ring-inset ring-black/5"
                          >
                            <span className="font-medium text-luma-ink">{it.productName}</span>
                            <span className="text-luma-ink/60">· {it.varietyName}</span>
                            <span className="ml-auto text-luma-ink/75 tabular-nums">
                              {it.qtyBoxes} cx · {it.qtyPallets} pal
                            </span>
                            <span className="w-full font-mono text-[11px] text-luma-ink/55 tabular-nums">
                              {(it.qtyBoxes * it.boxWeightKg).toLocaleString(locale)} kg
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  {evaluation.alerts.length > 0 && (
                    <Section
                      icon={<FileText className="h-3.5 w-3.5" strokeWidth={1.5} />}
                      title={t('operationalReview')}
                    >
                      <div className="space-y-2">
                        {evaluation.alerts.map((a, i) => (
                          <div
                            key={i}
                            className={cn(
                              'rounded-lg px-3 py-2 text-[12.5px] ring-1 ring-inset',
                              a.severity === 'critical'
                                ? 'bg-[hsl(var(--luma-earth)_/_0.1)] text-[hsl(var(--luma-earth))] ring-[hsl(var(--luma-earth)_/_0.3)]'
                                : 'bg-[hsl(var(--luma-sun)_/_0.12)] text-[hsl(var(--luma-earth))] ring-[hsl(var(--luma-sun)_/_0.35)]',
                            )}
                          >
                            {/* Mensagem renderizada em lib rule, aqui apenas placeholder do status */}
                            <StatusChip
                              kind="availability"
                              code={
                                a.severity === 'critical'
                                  ? 'NOT_AVAILABLE_FOR_DESTINATION'
                                  : 'UNDER_TECHNICAL_VALIDATION'
                              }
                            />
                            <span className="ml-2">{a.code.replaceAll('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Form do comprador */}
                  <Section
                    icon={<Mail className="h-3.5 w-3.5" strokeWidth={1.5} />}
                    title={t('buyerInfo')}
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className={labelCls} htmlFor="legalName">
                          {t('legalName')}
                        </label>
                        <input
                          id="legalName"
                          className={cn(fieldCls, 'mt-1.5')}
                          placeholder={t('legalNamePlaceholder')}
                          value={buyer.legalName}
                          onChange={(e) => updateBuyer({ legalName: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className={labelCls} htmlFor="displayName">
                          {t('displayName')}
                        </label>
                        <input
                          id="displayName"
                          className={cn(fieldCls, 'mt-1.5')}
                          placeholder={t('optional')}
                          value={buyer.displayName ?? ''}
                          onChange={(e) => updateBuyer({ displayName: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className={labelCls} htmlFor="buyerType">
                          {t('type')}
                        </label>
                        <select
                          id="buyerType"
                          className={cn(fieldCls, 'mt-1.5')}
                          value={buyer.type ?? ''}
                          onChange={(e) =>
                            updateBuyer({ type: (e.target.value || null) as BuyerCompanyType | null })
                          }
                        >
                          <option value="">{t('selectType')}</option>
                          {buyerCompanyTypes.map((b) => (
                            <option key={b.value} value={b.value}>
                              {locale === 'pt-br' ? b.labelPtBr : b.labelEn}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelCls} htmlFor="contactName">
                          {t('contactName')}
                        </label>
                        <input
                          id="contactName"
                          className={cn(fieldCls, 'mt-1.5')}
                          value={buyer.contactName}
                          onChange={(e) => updateBuyer({ contactName: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className={labelCls} htmlFor="contactEmail">
                          {t('contactEmail')}
                        </label>
                        <input
                          id="contactEmail"
                          type="email"
                          className={cn(fieldCls, 'mt-1.5')}
                          value={buyer.contactEmail}
                          onChange={(e) => updateBuyer({ contactEmail: e.target.value })}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className={labelCls} htmlFor="buyerNote">
                          {t('buyerNote')}
                        </label>
                        <textarea
                          id="buyerNote"
                          rows={3}
                          className={cn(fieldCls, 'mt-1.5 resize-none')}
                          placeholder={t('buyerNotePlaceholder')}
                          value={buyer.buyerNote ?? ''}
                          onChange={(e) => updateBuyer({ buyerNote: e.target.value })}
                        />
                      </div>
                    </div>
                  </Section>

                  {submission.status === 'error' && (
                    <div className="rounded-lg bg-[hsl(var(--luma-earth)_/_0.12)] px-4 py-3 text-[13px] text-[hsl(var(--luma-earth))] ring-1 ring-inset ring-[hsl(var(--luma-earth)_/_0.3)]">
                      {t('submitError')}: {submission.errorMessage}
                    </div>
                  )}

                  {hasCritical && (
                    <div className="rounded-lg bg-[hsl(var(--luma-earth)_/_0.08)] px-4 py-3 text-[12.5px] text-[hsl(var(--luma-earth))] ring-1 ring-inset ring-[hsl(var(--luma-earth)_/_0.25)]">
                      {t('hasCriticalAlerts')}
                    </div>
                  )}
                </div>
              )}

              {/* Footer — só aparece antes da submissão */}
              {submission.status !== 'submitted' && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 bg-white/40 px-6 py-4">
                  <p className="text-[10.5px] uppercase tracking-[0.3em] text-luma-ink/60">
                    {t('subjectToValidation')}
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={cn(
                      'group inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition',
                      canSubmit
                        ? 'bg-luma-olive text-luma-offwhite shadow-sm hover:brightness-110'
                        : 'bg-luma-ink/10 text-luma-ink/40 cursor-not-allowed',
                    )}
                  >
                    {submission.status === 'submitting' ? (
                      <>
                        <span>{t('submitting')}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" strokeWidth={1.75} />
                        <span>{t('submit')}</span>
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                          strokeWidth={1.75}
                        />
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.28em] text-luma-olive/80">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.55rem] uppercase tracking-[0.2em] text-luma-ink/50">{label}</dt>
      <dd className="text-[13px] text-luma-ink mt-0.5">{value}</dd>
    </div>
  );
}

function SuccessState({
  reference,
  onNewProposal,
}: {
  reference: string;
  onNewProposal: () => void;
}) {
  const t = useTranslations('review.success');
  return (
    <div className="flex-1 overflow-y-auto p-10 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-luma-olive/10 ring-1 ring-inset ring-luma-olive/30"
      >
        <CheckCircle2 className="h-8 w-8 text-luma-olive" strokeWidth={1.5} />
      </motion.div>
      <p className="mt-6 text-[0.65rem] uppercase tracking-[0.3em] text-luma-olive/80">
        {t('referenceLabel')}
      </p>
      <p className="mt-2 font-mono text-2xl tabular-nums text-luma-ink">{reference}</p>
      <p className="mt-6 mx-auto max-w-md text-[14px] leading-relaxed text-luma-ink/75">
        {t('body')}
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          onClick={onNewProposal}
          className="rounded-md bg-luma-olive px-5 py-2.5 text-sm font-medium text-luma-offwhite shadow-sm transition hover:brightness-110"
        >
          {t('newProposal')}
        </button>
      </div>
    </div>
  );
}
