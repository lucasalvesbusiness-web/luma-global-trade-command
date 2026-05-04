'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { signIn } from '@/server/auth/config';
import { signupBuyer } from '@/server/services/buyer-signup';
import { notifyBuyerSignup } from '@/server/mail/buyer-signup-notification';
import { signupLimiter } from '@/lib/security/rate-limit';

const inputSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z.string().min(2).max(120).trim(),
  companyLegalName: z.string().min(2).max(160).trim(),
  companyType: z.enum([
    'IMPORTER',
    'DISTRIBUTOR',
    'WHOLESALER',
    'RETAIL',
    'INDUSTRY',
    'TRADER',
  ]),
  countryIso2: z.string().length(2),
  taxId: z.string().max(40).optional(),
  contactPhone: z.string().max(40).optional(),
});

export type SignupActionResult =
  | { ok: true; alreadyExisted: boolean }
  | { ok: false; error: string };

export async function submitSignup(
  formData: FormData,
): Promise<SignupActionResult> {
  const h = await headers();
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown';
  const rl = await signupLimiter.limit(ip);
  if (!rl.success) {
    return {
      ok: false,
      error: 'Muitas tentativas. Tente novamente em alguns minutos.',
    };
  }

  const parsed = inputSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    companyLegalName: formData.get('companyLegalName'),
    companyType: formData.get('companyType'),
    countryIso2: formData.get('countryIso2'),
    taxId: formData.get('taxId') || undefined,
    contactPhone: formData.get('contactPhone') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: 'Dados inválidos. Revise os campos.' };
  }

  const result = await signupBuyer(parsed.data);
  if (!result.ok) {
    const reasons: Record<typeof result.reason, string> = {
      EMAIL_TAKEN_BY_STAFF: 'Este e-mail já é usado por um membro do time Luma.',
      EMAIL_TAKEN_BY_FIELD_OPERATOR:
        'Este e-mail já é usado por um operador de campo.',
      INVALID_COUNTRY: 'País inválido.',
    };
    return { ok: false, error: reasons[result.reason] };
  }

  const baseUrl =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    'http://localhost:3000';

  if (!result.alreadyExisted) {
    try {
      await notifyBuyerSignup({
        buyerName: parsed.data.name,
        buyerEmail: parsed.data.email,
        companyLegalName: parsed.data.companyLegalName,
        countryIso2: parsed.data.countryIso2,
        baseUrl,
        companyId: result.companyId,
      });
    } catch (err) {
      console.error('[signup] falha ao notificar Luma', err);
    }
  }

  try {
    await signIn('nodemailer', {
      email: parsed.data.email,
      redirect: false,
    });
  } catch (err) {
    console.error('[signup] falha ao disparar magic link', err);
  }

  return { ok: true, alreadyExisted: result.alreadyExisted };
}
