import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-luma-sand/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verifique seu email</CardTitle>
          <CardDescription>
            Enviamos um link de acesso. O link expira em 10 minutos. Em desenvolvimento, abra o
            Mailpit em{' '}
            <a className="underline" href="http://localhost:8025" target="_blank" rel="noreferrer">
              localhost:8025
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-luma-ink/60">
            Pode fechar esta aba; o link abrirá uma nova sessão autenticada.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
