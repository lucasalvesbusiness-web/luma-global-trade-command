import { router } from '@/server/trpc/trpc';
import { activityRouter } from '@/server/trpc/routers/activity';
import { companyRouter } from '@/server/trpc/routers/company';
import { dealRoomRouter } from '@/server/trpc/routers/deal-room';
import { discoveryRouter } from '@/server/trpc/routers/discovery';
import { membersRouter } from '@/server/trpc/routers/members';
import { reviewRouter } from '@/server/trpc/routers/review';
import { verificationRouter } from '@/server/trpc/routers/verification';
import { watchRouter } from '@/server/trpc/routers/watch';

export const appRouter = router({
  activity: activityRouter,
  company: companyRouter,
  dealRoom: dealRoomRouter,
  discovery: discoveryRouter,
  members: membersRouter,
  review: reviewRouter,
  verification: verificationRouter,
  watch: watchRouter,
});

export type AppRouter = typeof appRouter;
