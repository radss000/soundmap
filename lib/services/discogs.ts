// /lib/services/discogs.ts
import axios from 'axios';

export class DiscogsAPI {
  private baseUrl = 'https://api.discogs.com';
  private token: string;

  constructor() {
    this.token = process.env.DISCOGS_TOKEN || '';
    if (!this.token) {
      throw new Error('Discogs API token not found');
    }
  }

  private async request(endpoint: string, params = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Discogs token=${this.token}`,
          'User-Agent': 'SoundMapApp/1.0',
        },
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Discogs API error:', error);
      throw error;
    }
  }

  async searchArtists({ query, page = 1, perPage = 10, genre }: {
    query: string;
    page?: number;
    perPage?: number;
    genre?: string;
  }) {
    return this.request('/database/search', {
      q: query,
      type: 'artist',
      page,
      per_page: perPage,
      genre,
    });
  }

  async getArtist(id: string) {
    return this.request(`/artists/${id}`);
  }

  async getArtistRelated(id: string) {
    // Get artist's releases and collaborators
    const [releases, collaborations] = await Promise.all([
      this.request(`/artists/${id}/releases`),
      this.request(`/artists/${id}/collaborations`),
    ]);

    return {
      releases,
      collaborations,
    };
  }
}