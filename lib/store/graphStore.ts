// lib/store/graphStore.ts
'use client';

import { create } from 'zustand';
import { GraphNode, GraphLink } from '@/lib/types/graph';

interface GraphStore {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNode: GraphNode | null;
  setNodes: (nodes: GraphNode[]) => void;
  setLinks: (links: GraphLink[]) => void;
  setSelectedNode: (node: GraphNode | null) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  links: [],
  selectedNode: null,
  setNodes: (nodes) => set({ nodes }),
  setLinks: (links) => set({ links }),
  setSelectedNode: (node) => set({ selectedNode: node })
}));