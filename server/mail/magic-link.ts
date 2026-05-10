import { sendMail } from './transport';

export async function sendMagicLinkEmail(params: { to: string; url: string }) {
  const { to, url } = params;
  const subject = 'Acessar sua conta · Rede de Confiança B2B';
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 16px; color: #1a1a1a;">
      <h2 style="font-weight: 500; margin: 0 0 16px;">Bem-vindo(a)</h2>
      <p style="line-height: 1.55;">Clique no botão abaixo para acessar sua conta. O link expira em 10 minutos.</p>
      <p style="margin: 24px 0;">
        <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px;">Acessar plataforma</a>
      </p>
      <p style="font-size: 13px; color: #666; line-height: 1.55;">Se o botão não funcionar, copie e cole este link no navegador:<br/>${url}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="font-size: 12px; color: #999;">Você recebeu este email porque alguém solicitou acesso usando o seu endereço. Se não foi você, ignore.</p>
    </div>
  `;
  const text = `Acesse sua conta: ${url}\n\nO link expira em 10 minutos.`;
  await sendMail({ to, subject, html, text });
}
