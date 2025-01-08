// app/components/graph/hooks/useGraphInitialization.ts
'use client';

import { useEffect } from 'react';
import { useGraphStore } from '@/lib/store/graphStore';
import { mockNodes, mockLinks } from '@/lib/data/mockData';

export function useGraphInitialization() {
  const { nodes, setNodes, setLinks } = useGraphStore();

  useEffect(() => {
    // Initialiser seulement si nous n'avons pas déjà des nœuds
    if (!nodes || nodes.length === 0) {
      setNodes(mockNodes);
      setLinks(mockLinks);
    }
  }, [setNodes, setLinks, nodes]);
}