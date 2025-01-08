// lib/types/discogs.ts
export interface DiscogsArtist {
    id: number;
    name: string;
    realname?: string;
    images?: Array<{
      type: string;
      uri: string;
      resource_url: string;
      uri150: string;
    }>;
    profile?: string;
    urls?: string[];
    namevariations?: string[];
    aliases?: Array<{
      id: number;
      name: string;
      resource_url: string;
    }>;
    genres?: string[];
    data_quality?: string;
  }
  
  export interface DiscogsRelease {
    id: number;
    title: string;
    year?: number;
    thumb?: string;
    cover_image?: string;
    formats?: Array<{
      name: string;
      qty: string;
      descriptions?: string[];
    }>;
    genres?: string[];
    styles?: string[];
    labels?: Array<{
      name: string;
      entity_type: string;
      catno: string;
      resource_url: string;
      id: number;
    }>;
  }
  
  export interface DiscogsSearchResponse<T> {
    pagination: {
      page: number;
      pages: number;
      per_page: number;
      items: number;
    };
    results: T[];
  }
  