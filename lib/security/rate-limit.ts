/**
 * Centralized rate-limiters backed by Upstash Redis.
 *
 * Without UPSTASH_REDIS_REST_URL/TOKEN, the limiter degrades to a permissive
 * no-op so dev/test/CI never blocks. In production it MUST be configured —
 * the deploy go-live gate verifies a lockout in staging.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  url && token
    ? new Redis({ url, token })
    : null;

type Limiter = {
  limit: (key: string) => Promise<{ success: boolean; reset: number; remaining: number }>;
};

function makeLimiter(name: string, limit: number, windowSec: number): Limiter {
  if (!redis) {
    return {
      async limit() {
        return { success: true, reset: 0, remaining: limit };
      },
    };
  }
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    analytics: false,
    prefix: `rl:${name}`,
  });
  return {
    async limit(key) {
      const r = await rl.limit(key);
      return { success: r.success, reset: r.reset, remaining: r.remaining };
    },
  };
}

/** Magic-link sign-in: 5 per IP per 10 minutes. */
export const magicLinkLimiter = makeLimiter('magic-link', 5, 600);

/** Buyer signup form: 3 per IP per 30 minutes. */
export const signupLimiter = makeLimiter('signup', 3, 1800);

/** Proposal submit: 10 per buyer-or-IP per hour. */
export const proposalSubmitLimiter = makeLimiter('proposal-submit', 10, 3600);

/** Extracts the client IP from a Next.js request, falling back to a label. */
export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
