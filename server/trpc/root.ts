import { router } from '@/server/trpc/trpc';
import { companyRouter } from '@/server/trpc/routers/company';
import { discoveryRouter } from '@/server/trpc/routers/discovery';
import { verificationRouter } from '@/server/trpc/routers/verification';

export const appRouter = router({
  company: companyRouter,
  discovery: discoveryRouter,
  verification: verificationRouter,
});

export type AppRouter = typeof appRouter;
