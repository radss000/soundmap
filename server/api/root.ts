import { createTRPCRouter } from '@/server/api/trpc';
import { artistRouter } from './routers/artist';
import { labelRouter } from './routers/label';
import { releaseRouter } from './routers/release';

export const appRouter = createTRPCRouter({
  artist: artistRouter,
  label: labelRouter,
  release: releaseRouter,
});

export type AppRouter = typeof appRouter;