// lib/data/mockData.ts
import { GraphNode, GraphLink } from '../types/graph';

export const mockNodes: GraphNode[] = [
  { 
    id: '1', 
    name: 'Daft Punk', 
    type: 'artist', 
    color: '#ff4081',
    size: 20 
  },
  { 
    id: '2', 
    name: 'Justice', 
    type: 'artist', 
    color: '#ff4081',
    size: 15 
  },
  { 
    id: '3', 
    name: 'Ed Banger Records', 
    type: 'label', 
    color: '#00bcd4',
    size: 18 
  },
  { 
    id: '4', 
    name: 'Random Access Memories', 
    type: 'release', 
    color: '#4caf50',
    size: 12 
  }
];

export const mockLinks: GraphLink[] = [
  { 
    source: '1', 
    target: '2', 
    type: 'collaboration' 
  },
  { 
    source: '2', 
    target: '3', 
    type: 'release' 
  },
  { 
    source: '1', 
    target: '4', 
    type: 'release' 
  }
];