import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { DiscogsAPI } from '@/lib/services/discogs';

export async function createContext(opts: FetchCreateContextFnOptions) {
  return {
    discogs: new DiscogsAPI(),
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;