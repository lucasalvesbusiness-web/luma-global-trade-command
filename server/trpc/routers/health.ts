import { publicProcedure, router } from '../trpc';

export const healthRouter = router({
  ping: publicProcedure.query(() => ({
    status: 'ok' as const,
    service: 'luma-global-trade-command',
    timestamp: new Date().toISOString(),
  })),
});
