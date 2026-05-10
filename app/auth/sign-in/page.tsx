import { redirect } from 'next/navigation';

import { auth, signIn } from '@/server/auth/config';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/');

  const { callbackUrl } = await searchParams;

  async function handleSignIn(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '').trim();
    if (!email) return;
    await signIn('nodemailer', {
      email,
      redirectTo: callbackUrl ?? '/',
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-luma-sand/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acessar plataforma</CardTitle>
          <CardDescription>
            Enviaremos um link mágico para o seu email. Sem senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSignIn} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email corporativo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="voce@empresa.com.br"
                autoComplete="email"
              />
            </div>
            <Button type="submit">Receber link de acesso</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
