// lib/data/mockData.ts
import { GraphNode, GraphLink } from '../types/graph';

export const mockNodes: GraphNode[] = [
  { 
    id: '1', 
    name: 'Daft Punk', 
    type: 'artist', 
    color: 'rgb(255, 64, 129)', // Format RGB au lieu de hex
    size: 20 
  },
  { 
    id: '2', 
    name: 'Justice', 
    type: 'artist', 
    color: 'rgb(255, 64, 129)',
    size: 15 
  },
  { 
    id: '3', 
    name: 'Ed Banger Records', 
    type: 'label', 
    color: 'rgb(0, 188, 212)',
    size: 18 
  },
  { 
    id: '4', 
    name: 'Random Access Memories', 
    type: 'release', 
    color: 'rgb(76, 175, 80)',
    size: 12 
  }
];

export const mockLinks: GraphLink[] = [
  { source: '1', target: '2', type: 'collaboration' },
  { source: '2', target: '3', type: 'release' },
  { source: '1', target: '4', type: 'release' }
];