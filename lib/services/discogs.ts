import axios, { AxiosInstance } from 'axios';

export class DiscogsAPI {
  private static instance: DiscogsAPI;
  private client: AxiosInstance;

  private constructor() {
    const token = process.env.NEXT_PUBLIC_DISCOGS_TOKEN;
    const userAgent = process.env.NEXT_PUBLIC_DISCOGS_USER_AGENT;

    if (!token) {
      throw new Error('NEXT_PUBLIC_DISCOGS_TOKEN is not configured');
    }

    if (!userAgent) {
      throw new Error('NEXT_PUBLIC_DISCOGS_USER_AGENT is not configured');
    }

    this.client = axios.create({
      baseURL: 'https://api.discogs.com',
      headers: {
        'Authorization': `Discogs token=${token}`,
        'User-Agent': userAgent
      }
    });

    // Add request interceptor for debugging
    this.client.interceptors.request.use(request => {
      console.log('Request Headers:', request.headers);
      return request;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('Discogs API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        throw error;
      }
    );
  }

  public static getInstance(): DiscogsAPI {
    if (!DiscogsAPI.instance) {
      DiscogsAPI.instance = new DiscogsAPI();
    }
    return DiscogsAPI.instance;
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

  // Test method to verify API connection
  async testConnection() {
    try {
      const response = await this.client.get('/database/search', {
        params: { q: 'test', type: 'artist', per_page: 1 }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Test connection error:', error);
      return false;
    }
  }
}