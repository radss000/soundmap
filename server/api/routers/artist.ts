import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const artistRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        page: z.number().optional().default(1),
        perPage: z.number().optional().default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const results = await ctx.discogs.searchArtists(input);
      return results;
    }),
});