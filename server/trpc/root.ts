import { router } from '@/server/trpc/trpc';
import { companyRouter } from '@/server/trpc/routers/company';
import { dealRoomRouter } from '@/server/trpc/routers/deal-room';
import { discoveryRouter } from '@/server/trpc/routers/discovery';
import { membersRouter } from '@/server/trpc/routers/members';
import { reviewRouter } from '@/server/trpc/routers/review';
import { verificationRouter } from '@/server/trpc/routers/verification';

export const appRouter = router({
  company: companyRouter,
  dealRoom: dealRoomRouter,
  discovery: discoveryRouter,
  members: membersRouter,
  review: reviewRouter,
  verification: verificationRouter,
});

export type AppRouter = typeof appRouter;
