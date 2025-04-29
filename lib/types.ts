// lib/types.ts
export interface Release {
    id: string;
    title: string;
    year: number;
    artistNames: string[];
    labelName: string | null;
    genres: string[];
    styles: string[];
  }
  
  export type Node = Release | Cluster;
  
  export interface Transform {
    x: number;
    y: number;
    scale: number;
  }