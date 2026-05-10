/**
 * Structured logger. Pretty in dev when pino-pretty is available;
 * plain JSON otherwise. Sentry breadcrumbs are added automatically
 * when Sentry is initialized.
 */

import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

function hasPinoPretty(): boolean {
  try {
    require.resolve('pino-pretty');
    return true;
  } catch {
    return false;
  }
}

export const log = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  transport:
    !isProd && hasPinoPretty()
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
        }
      : undefined,
  redact: {
    paths: ['*.password', '*.token', '*.secret', 'authorization', 'cookie'],
    censor: '[redacted]',
  },
});
