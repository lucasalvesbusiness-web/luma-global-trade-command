import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST ?? 'localhost';
const port = Number(process.env.SMTP_PORT ?? 1025);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;

export const mailFrom = process.env.SMTP_FROM ?? 'no-reply@lastro.network';

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user && pass ? { user, pass } : undefined,
});

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  return transporter.sendMail({
    from: mailFrom,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}
