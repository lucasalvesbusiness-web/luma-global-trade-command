'use client';

import { useActionState, useState } from 'react';

import { signInAction, signUpAction, type AuthActionState } from '@/app/auth/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

type Mode = 'signin' | 'signup';

const initialState: AuthActionState = { ok: false };

export function AuthForm({
  initialMode = 'signin',
  callbackUrl,
}: {
  initialMode?: Mode;
  callbackUrl?: string;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [signInState, signInDispatch, signInPending] = useActionState(
    signInAction,
    initialState,
  );
  const [signUpState, signUpDispatch, signUpPending] = useActionState(
    signUpAction,
    initialState,
  );

  const state = mode === 'signin' ? signInState : signUpState;
  const pending = mode === 'signin' ? signInPending : signUpPending;
  const dispatch = mode === 'signin' ? signInDispatch : signUpDispatch;

  return (
    <>
      <h1 className="display-xl mb-2 text-2xl text-ink-50">
        {mode === 'signin' ? 'Entrar' : 'Criar conta'}
      </h1>
      <p className="mb-6 text-sm text-ink-300">
        {mode === 'signin'
          ? 'Email e senha. Direto.'
          : 'Sua identidade pessoal — empresa cadastra-se no próximo passo.'}
      </p>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-md border border-white/[0.07] p-1">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`flex-1 rounded-sm py-2 text-[11px] uppercase tracking-wider transition-colors ${
            mode === 'signin'
              ? 'bg-amber/10 text-amber-glow'
              : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 rounded-sm py-2 text-[11px] uppercase tracking-wider transition-colors ${
            mode === 'signup'
              ? 'bg-amber/10 text-amber-glow'
              : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          Cadastrar
        </button>
      </div>

      <form action={dispatch} className="flex flex-col gap-4">
        {callbackUrl && <input type="hidden" name="redirectTo" value={callbackUrl} />}

        {mode === 'signup' && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={120}
              placeholder="Maria Silva"
              autoComplete="name"
              className="h-12 text-base"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="voce@empresa.com.br"
            autoComplete="email"
            className="h-12 text-base"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="h-12 text-base"
          />
        </div>

        {state?.error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending}>
          {pending
            ? mode === 'signin'
              ? 'Entrando…'
              : 'Criando conta…'
            : mode === 'signin'
              ? 'Entrar →'
              : 'Criar conta →'}
        </Button>
      </form>
    </>
  );
}
