'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { db } from '@/lib/db';
import { signIn } from '@/server/auth/config';

const signUpSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AuthActionState = {
  ok: boolean;
  error?: string;
};

export async function signUpAction(
  _prev: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? 'Dados inválidos.',
    };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: 'Este email já está cadastrado. Faça login.' };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      emailVerified: new Date(),
    },
  });

  // Sign-in via Credentials triggers a redirect on success.
  await signIn('credentials', {
    email,
    password: parsed.data.password,
    redirectTo: (formData.get('redirectTo') as string) || '/start',
  });

  // Should not be reached (signIn throws via redirect).
  redirect('/start');
}

export async function signInAction(
  _prev: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, error: 'Email e senha são obrigatórios.' };
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email.toLowerCase().trim(),
      password: parsed.data.password,
      redirectTo: (formData.get('redirectTo') as string) || '/inbox',
    });
  } catch (e) {
    // Auth.js internally throws a redirect on success — re-throw it.
    if (e instanceof Error && (e as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) {
      throw e;
    }
    return { ok: false, error: 'Email ou senha inválidos.' };
  }

  return { ok: true };
}
