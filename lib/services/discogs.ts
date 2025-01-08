import axios from 'axios';

export class DiscogsAPI {
    private static instance: DiscogsAPI;
    private client: any;
  
    private constructor() {
      const token = process.env.NEXT_PUBLIC_DISCOGS_TOKEN;
      if (!token) {
        throw new Error('NEXT_PUBLIC_DISCOGS_TOKEN is not configured');
      }
  
      this.client = axios.create({
        baseURL: 'https://api.discogs.com',
        headers: {
          'Authorization': `Discogs token=${token}`,
          'User-Agent': 'SoundMapApp/1.0'
        }
      });
  
      // Add response interceptor for better error handling
      this.client.interceptors.response.use(
        response => response,
        error => {
          console.error('Discogs API Error:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            url: error.config?.url
          });
          throw error;
        }
      );
    }
  
    async searchArtists({ query, page = 1, perPage = 10 }) {
      try {
        const response = await this.client.get('/database/search', {
          params: {
            q: query,
            type: 'artist',
            page,
            per_page: perPage
          }
        });
        
        // Transform response to match expected format
        return {
          results: response.data.results.map(artist => ({
            id: artist.id,
            name: artist.title,
            imageUrl: artist.thumb
          })),
          pagination: response.data.pagination
        };
      } catch (error) {
        console.error('Search artists error:', error);
        throw error;
      }
    }
  }