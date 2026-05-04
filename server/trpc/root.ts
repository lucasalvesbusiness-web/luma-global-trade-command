import { router } from './trpc';

import { adminRouter } from './routers/admin';
import { availabilityRouter } from './routers/availability';
import { catalogRouter } from './routers/catalog';
import { complianceRouter } from './routers/compliance';
import { geoRouter } from './routers/geo';
import { healthRouter } from './routers/health';
import { internalRouter } from './routers/internal';
import { buyerRouter } from './routers/buyer';
import { fieldRouter } from './routers/field';
import { originRouter } from './routers/origin';
import { proposalRouter } from './routers/proposal';
import { staffRouter } from './routers/staff';

export const appRouter = router({
  health: healthRouter,
  catalog: catalogRouter,
  geo: geoRouter,
  availability: availabilityRouter,
  compliance: complianceRouter,
  proposal: proposalRouter,
  internal: internalRouter,
  admin: adminRouter,
  staff: staffRouter,
  origin: originRouter,
  field: fieldRouter,
  buyer: buyerRouter,
});

export type AppRouter = typeof appRouter;
