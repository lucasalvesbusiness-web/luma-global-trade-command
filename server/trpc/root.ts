import { router } from '@/server/trpc/trpc';
import { companyRouter } from '@/server/trpc/routers/company';
import { verificationRouter } from '@/server/trpc/routers/verification';

export const appRouter = router({
  company: companyRouter,
  verification: verificationRouter,
});

export type AppRouter = typeof appRouter;
