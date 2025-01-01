// lib/types/graph.ts
export interface GraphNode {
  id: string;
  name: string;
  type: 'artist' | 'label' | 'release';
  color: string;
  size?: number;
  imageUrl?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'collaboration' | 'release' | 'remix';
  value?: number;
}