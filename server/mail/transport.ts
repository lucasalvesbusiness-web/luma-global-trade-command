/**
 * Transport SMTP unificado.
 *
 * Dev: Mailpit (localhost:1025) — sem auth, sem TLS.
 * Prod: provedor real (Resend, Postmark, SES) via env vars.
 *   Resend: SMTP_HOST=smtp.resend.com, PORT=465, USER=resend, PASSWORD=<API key>.
 *
 * Em prod, SMTP_HOST + SMTP_USER + SMTP_PASSWORD são obrigatórios — a primeira chamada
 * a smtpTransport() lança se faltarem. Isso quebra cedo em vez de silenciar e-mails
 * críticos (magic-link, notificações de proposta).
 */

import nodemailer, { type Transporter } from 'nodemailer';

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

export const SMTP_FROM =
  process.env.SMTP_FROM ?? 'Luma Global Trade Command <no-reply@luma.local>';

export const SMTP_INTERNAL_INBOX =
  process.env.LUMA_INTERNAL_INBOX ?? 'commercial@luma.local';

let cached: Transporter | null = null;

export function smtpTransport(): Transporter {
  if (cached) return cached;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? 1025);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;

  if (isProd) {
    const missing = [
      !smtpHost && 'SMTP_HOST',
      !smtpUser && 'SMTP_USER',
      !smtpPass && 'SMTP_PASSWORD',
    ].filter(Boolean);
    if (missing.length > 0) {
      throw new Error(
        `[mail] Missing SMTP credentials in production: ${missing.join(', ')}. ` +
          `Configure Resend (or equivalent) before deploying — silent skip is not allowed.`,
      );
    }
  }

  cached = nodemailer.createTransport({
    host: smtpHost ?? 'localhost',
    port: smtpPort,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    secure: smtpPort === 465,
  });
  return cached;
}

/**
 * Skip envio em test (sem Mailpit) ou quando explicitamente desativado via
 * MAIL_DISABLED=1. Em prod, a ausência de SMTP_HOST agora lança em smtpTransport()
 * em vez de silenciar — esta função NÃO retorna true em prod por falta de config.
 */
export function shouldSkipSmtp(): boolean {
  if (process.env.MAIL_DISABLED === '1') return true;
  if (isTest) return true;
  return false;
}
