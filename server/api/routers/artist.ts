import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { DiscogsAPI } from '@/lib/services/discogs';

export const artistRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        page: z.number().default(1),
        perPage: z.number().default(10)
      })
    )
    .query(async ({ input }) => {
      try {
        const discogs = DiscogsAPI.getInstance();
        const results = await discogs.searchArtists(input);
        
        if (!results || !results.results) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No results found',
          });
        }
        
        return results;
      } catch (error) {
        console.error('Artist search error:', error);
        
        // Transform errors into proper tRPC errors
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          cause: error
        });
      }
    })
});