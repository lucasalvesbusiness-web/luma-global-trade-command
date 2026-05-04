/**
 * Structured logger. Pretty in dev, JSON in prod.
 * Sentry breadcrumbs are added automatically when Sentry is initialized.
 */

import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

export const log = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
      },
  redact: {
    paths: ['*.password', '*.token', '*.secret', 'authorization', 'cookie'],
    censor: '[redacted]',
  },
});
