import { router } from '@/server/trpc/trpc';
import { activityRouter } from '@/server/trpc/routers/activity';
import { companyRouter } from '@/server/trpc/routers/company';
import { dealRoomRouter } from '@/server/trpc/routers/deal-room';
import { discoveryRouter } from '@/server/trpc/routers/discovery';
import { homeRouter } from '@/server/trpc/routers/home';
import { membersRouter } from '@/server/trpc/routers/members';
import { notificationsRouter } from '@/server/trpc/routers/notifications';
import { reviewRouter } from '@/server/trpc/routers/review';
import { searchRouter } from '@/server/trpc/routers/search';
import { verificationRouter } from '@/server/trpc/routers/verification';
import { watchRouter } from '@/server/trpc/routers/watch';

export const appRouter = router({
  activity: activityRouter,
  company: companyRouter,
  dealRoom: dealRoomRouter,
  discovery: discoveryRouter,
  home: homeRouter,
  members: membersRouter,
  notifications: notificationsRouter,
  review: reviewRouter,
  search: searchRouter,
  verification: verificationRouter,
  watch: watchRouter,
});

export type AppRouter = typeof appRouter;
