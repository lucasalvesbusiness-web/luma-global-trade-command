'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

import { trpc } from '@/lib/trpc/react';

const TYPES = [
  { value: 'IMPORTER', label: 'Importador' },
  { value: 'DISTRIBUTOR', label: 'Distribuidor' },
  { value: 'WHOLESALER', label: 'Atacadista' },
  { value: 'RETAIL', label: 'Varejo' },
  { value: 'INDUSTRY', label: 'Indústria' },
  { value: 'TRADER', label: 'Trader' },
] as const;

type Country = { iso2: string; name: string };
type FormState = {
  email: string;
  name: string;
  companyLegalName: string;
  companyType: (typeof TYPES)[number]['value'];
  countryIso2: string;
  taxId: string;
  contactPhone: string;
};

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-2.5 py-1.5 text-[13px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';

export function AdminBuyerCreateClient({ countries }: { countries: Country[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    email: '',
    name: '',
    companyLegalName: '',
    companyType: 'IMPORTER',
    countryIso2: countries[0]?.iso2 ?? 'BR',
    taxId: '',
    contactPhone: '',
  });
  const [sendInvite, setSendInvite] = useState(true);

  const utils = trpc.useUtils();
  const createM = trpc.buyer.adminCreate.useMutation();
  const resendM = trpc.buyer.adminResendMagicLink.useMutation();

  function set<K extends keyof FormState>(k: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = await createM.mutateAsync({
      email: form.email.trim().toLowerCase(),
      name: form.name.trim(),
      companyLegalName: form.companyLegalName.trim(),
      companyType: form.companyType,
      countryIso2: form.countryIso2,
      taxId: form.taxId.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
    });
    if (sendInvite) {
      await resendM.mutateAsync({ buyerCompanyId: result.companyId }).catch(() => {});
    }
    await utils.buyer.adminList.invalidate();
    router.push(`/admin/buyers/${result.companyId}`);
  }

  return (
    <main className="space-y-5 p-6">
      <Link
        href="/admin/buyers"
        className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.24em] text-luma-ink/60 hover:text-luma-ink"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} /> Compradores
      </Link>
      <h2 className="font-display text-2xl font-light text-luma-ink">
        Novo comprador
      </h2>
      <p className="max-w-xl text-[13px] text-luma-ink/65">
        Cria um buyer pré-aprovado, sem passar pelo signup público. Use para
        buyers já validados offline com a Luma.
      </p>

      <form
        onSubmit={handleSubmit}
        className="grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2"
      >
        <Field label="E-mail">
          <input
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            className={inputCls}
          />
        </Field>
        <Field label="Nome do contato">
          <input
            type="text"
            required
            value={form.name}
            onChange={set('name')}
            className={inputCls}
          />
        </Field>
        <Field label="Razão social">
          <input
            type="text"
            required
            value={form.companyLegalName}
            onChange={set('companyLegalName')}
            className={inputCls}
          />
        </Field>
        <Field label="Tipo">
          <select
            value={form.companyType}
            onChange={set('companyType')}
            className={inputCls}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="País">
          <select
            value={form.countryIso2}
            onChange={set('countryIso2')}
            className={inputCls}
          >
            {countries.map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tax ID / CNPJ (opcional)">
          <input
            type="text"
            value={form.taxId}
            onChange={set('taxId')}
            className={inputCls}
          />
        </Field>
        <Field label="Telefone (opcional)">
          <input
            type="text"
            value={form.contactPhone}
            onChange={set('contactPhone')}
            className={inputCls}
          />
        </Field>
        <div />

        <label className="md:col-span-2 flex items-center gap-2 text-[12.5px] text-luma-ink/75">
          <input
            type="checkbox"
            checked={sendInvite}
            onChange={(e) => setSendInvite(e.target.checked)}
            className="h-4 w-4 rounded border-black/20"
          />
          Enviar magic link de acesso imediatamente
        </label>

        {createM.error && (
          <p className="md:col-span-2 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 ring-1 ring-inset ring-red-200">
            {createM.error.message}
          </p>
        )}

        <div className="md:col-span-2 mt-2 flex justify-end">
          <button
            type="submit"
            disabled={createM.isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-4 py-2 text-[12.5px] font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            {createM.isPending ? 'Criando…' : 'Criar comprador'}
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[0.62rem] font-medium uppercase tracking-[0.24em] text-luma-olive/80">
        {label}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}
