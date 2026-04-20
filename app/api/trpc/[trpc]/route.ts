import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { createContext } from '@/server/trpc/trpc';
import { appRouter } from '@/server/trpc/root';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`[trpc] ${path ?? '<no-path>'} → ${error.message}`);
          }
        : undefined,
  });

export { handler as GET, handler as POST };
