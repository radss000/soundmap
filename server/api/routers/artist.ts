import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { DiscogsAPI } from '@/lib/services/discogs';

export const artistRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        page: z.number().default(1),
        perPage: z.number().default(10)
      })
    )
    .query(async ({ input }) => {
      console.log('Searching for:', input.query);
      
      try {
        const discogs = DiscogsAPI.getInstance();
        const results = await discogs.searchArtists({
          query: input.query,
          page: input.page,
          perPage: input.perPage
        });

        console.log('Discogs results:', results);
        
        return results;
      } catch (error) {
        console.error('Search error:', error);
        throw error;
      }
    })
});