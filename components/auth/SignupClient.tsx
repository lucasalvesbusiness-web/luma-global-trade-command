'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';

import { submitSignup, type SignupActionResult } from '@/app/signup/actions';
import { cn } from '@/lib/utils';

type Country = { iso2: string; name: string };

const TYPES = [
  { value: 'IMPORTER', label: 'Importador' },
  { value: 'DISTRIBUTOR', label: 'Distribuidor' },
  { value: 'WHOLESALER', label: 'Atacadista' },
  { value: 'RETAIL', label: 'Varejo' },
  { value: 'INDUSTRY', label: 'Indústria' },
  { value: 'TRADER', label: 'Trader' },
] as const;

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-3 py-2 text-[13.5px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';
const labelCls =
  'text-[0.62rem] uppercase tracking-[0.24em] text-luma-olive/80 font-medium';

export function SignupClient({ countries }: { countries: Country[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SignupActionResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const r = await submitSignup(fd);
    setResult(r);
    setSubmitting(false);
  }

  if (result?.ok) {
    return (
      <main className="min-h-svh flex items-center justify-center p-6 bg-luma-offwhite">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse at 30% 30%, hsl(var(--luma-sand) / 0.55) 0%, hsl(var(--luma-offwhite)) 70%)',
          }}
        />
        <div className="luma-glass w-full max-w-md rounded-2xl p-8 text-center shadow-xl shadow-black/10">
          <CheckCircle2
            className="mx-auto h-10 w-10 text-luma-field"
            strokeWidth={1.5}
          />
          <h1 className="mt-3 font-display text-2xl font-light text-luma-ink">
            Cadastro recebido
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-luma-ink/70">
            {result.alreadyExisted
              ? 'Você já tem um cadastro com este e-mail.'
              : 'Recebemos sua solicitação. O time Luma revisará e você receberá uma confirmação por e-mail.'}
          </p>
          <p className="mt-3 text-[12.5px] text-luma-ink/65">
            Enviamos um link mágico de acesso para o seu e-mail. Use-o para entrar
            assim que seu cadastro for aprovado.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-luma-olive px-4 py-2 text-[12px] font-medium text-white shadow-sm hover:opacity-90"
          >
            Voltar à página inicial
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh flex items-center justify-center p-6 bg-luma-offwhite">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 30% 30%, hsl(var(--luma-sand) / 0.55) 0%, hsl(var(--luma-offwhite)) 70%)',
        }}
      />
      <div className="luma-glass w-full max-w-xl rounded-2xl p-8 shadow-xl shadow-black/10">
        <p className="text-[0.68rem] uppercase tracking-[0.4em] text-luma-olive/80">
          Luma × Spectre
        </p>
        <h1 className="mt-2 font-display text-2xl font-light text-luma-ink">
          Solicitar acesso
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-luma-ink/65">
          Cadastre-se para acompanhar produtos, origens e disponibilidades. Sua
          solicitação passa por aprovação manual da Luma.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelCls}>
              Seu nome
            </label>
            <input
              id="name"
              name="name"
              required
              minLength={2}
              className={cn(inputCls, 'mt-1')}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={cn(inputCls, 'mt-1')}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="companyLegalName" className={labelCls}>
              Razão social da empresa
            </label>
            <input
              id="companyLegalName"
              name="companyLegalName"
              required
              minLength={2}
              className={cn(inputCls, 'mt-1')}
            />
          </div>
          <div>
            <label htmlFor="companyType" className={labelCls}>
              Tipo de empresa
            </label>
            <select
              id="companyType"
              name="companyType"
              required
              defaultValue="IMPORTER"
              className={cn(inputCls, 'mt-1')}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="countryIso2" className={labelCls}>
              País
            </label>
            <select
              id="countryIso2"
              name="countryIso2"
              required
              className={cn(inputCls, 'mt-1')}
            >
              <option value="">Selecione…</option>
              {countries.map((c) => (
                <option key={c.iso2} value={c.iso2}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="taxId" className={labelCls}>
              CNPJ / VAT (opcional)
            </label>
            <input id="taxId" name="taxId" className={cn(inputCls, 'mt-1')} />
          </div>
          <div>
            <label htmlFor="contactPhone" className={labelCls}>
              Telefone (opcional)
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              className={cn(inputCls, 'mt-1')}
            />
          </div>

          {result && !result.ok && (
            <div className="md:col-span-2 rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700 ring-1 ring-inset ring-red-200">
              {result.error}
            </div>
          )}

          <div className="md:col-span-2 mt-2 flex items-center justify-between gap-3">
            <Link
              href="/auth/sign-in"
              className="text-[12px] uppercase tracking-[0.22em] text-luma-ink/65 hover:text-luma-ink"
            >
              Já tem cadastro? Entrar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-4 py-2 text-[12.5px] font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              {submitting ? 'Enviando…' : 'Solicitar acesso'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
