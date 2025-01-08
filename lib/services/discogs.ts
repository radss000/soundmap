import axios from 'axios';

export class DiscogsAPI {
  private static instance: DiscogsAPI;
  private client: any;

  private constructor() {
    this.client = axios.create({
      baseURL: 'https://api.discogs.com',
      headers: {
        'Authorization': `Discogs token=${process.env.NEXT_PUBLIC_DISCOGS_TOKEN}`,
        'User-Agent': 'SoundMapApp/1.0'
      }
    });

    // Ajouter un intercepteur pour logger les requêtes
    this.client.interceptors.request.use(request => {
      console.log('Making request to Discogs:', request.url);
      return request;
    });

    // Ajouter un intercepteur pour logger les réponses
    this.client.interceptors.response.use(
      response => {
        console.log('Received Discogs response:', response.status);
        return response;
      },
      error => {
        console.error('Discogs API error:', {
          status: error.response?.status,
          data: error.response?.data,
          config: error.config
        });
        return Promise.reject(error);
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
      console.log('Searching artists with params:', { query, page, perPage });
      const response = await this.client.get('/database/search', {
        params: {
          q: query,
          type: 'artist',
          page,
          per_page: perPage
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching artists:', error);
      throw error;
    }
  }

  async getArtist(id: string) {
    try {
      const response = await this.client.get(`/artists/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting artist:', error);
      throw error;
    }
  }

  async getArtistReleases(id: string, { page = 1, perPage = 50 } = {}) {
    try {
      const response = await this.client.get(`/artists/${id}/releases`, {
        params: {
          page,
          per_page: perPage,
          sort: 'year',
          sort_order: 'desc'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting artist releases:', error);
      throw error;
    }
  }

  async getReleaseDetails(id: string) {
    try {
      const response = await this.client.get(`/releases/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting release details:', error);
      throw error;
    }
  }

  async getLabelDetails(id: string) {
    try {
      const response = await this.client.get(`/labels/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting label details:', error);
      throw error;
    }
  }

  async getArtistCollaborations(id: string) {
    // Pour l'instant, c'est une recherche simple basée sur les crédits des releases
    try {
      const releases = await this.getArtistReleases(id);
      const collaborations = new Set();
      
      for (const release of releases.releases) {
        if (release.extraartists) {
          release.extraartists.forEach(artist => {
            if (artist.id !== parseInt(id)) {
              collaborations.add(artist);
            }
          });
        }
      }
      
      return Array.from(collaborations);
    } catch (error) {
      console.error('Error getting artist collaborations:', error);
      throw error;
    }
  }
}