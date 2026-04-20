import { router } from './trpc';

import { availabilityRouter } from './routers/availability';
import { catalogRouter } from './routers/catalog';
import { complianceRouter } from './routers/compliance';
import { geoRouter } from './routers/geo';
import { healthRouter } from './routers/health';
import { proposalRouter } from './routers/proposal';

export const appRouter = router({
  health: healthRouter,
  catalog: catalogRouter,
  geo: geoRouter,
  availability: availabilityRouter,
  compliance: complianceRouter,
  proposal: proposalRouter,
});

export type AppRouter = typeof appRouter;
