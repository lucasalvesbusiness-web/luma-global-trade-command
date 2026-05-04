/**
 * Next.js calls register() once per server runtime. We use it to load Sentry
 * for both Node and Edge runtimes.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

import * as Sentry from '@sentry/nextjs';

export const onRequestError = Sentry.captureRequestError;
