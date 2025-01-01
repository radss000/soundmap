// /server/api/routers/artist.ts
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { DiscogsAPI } from '@/lib/services/discogs';
import { redis } from '@/lib/services/redis';

const CACHE_TTL = 3600; // 1 hour

export const artistRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
        genre: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const cacheKey = `artist:search:${input.query}:${input.page}:${input.genre}`;
      
      // Check cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // If not in cache, fetch from Discogs
      const discogs = new DiscogsAPI();
      const results = await discogs.searchArtists({
        query: input.query,
        page: input.page,
        perPage: input.limit,
        genre: input.genre,
      });

      // Cache the results
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results));

      return results;
    }),

  getById: publicProcedure
    .input(z.string())
    .query(async ({ input: id }) => {
      const cacheKey = `artist:${id}`;
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const discogs = new DiscogsAPI();
      const artist = await discogs.getArtist(id);

      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(artist));

      return artist;
    }),

  getRelated: publicProcedure
    .input(z.string())
    .query(async ({ input: id }) => {
      const cacheKey = `artist:${id}:related`;
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const discogs = new DiscogsAPI();
      const related = await discogs.getArtistRelated(id);

      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(related));

      return related;
    }),
});