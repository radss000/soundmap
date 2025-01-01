'use client';

import { useEffect } from 'react';
import { useGraphStore } from '@/lib/store/graphStore';
import { mockNodes, mockLinks } from '@/lib/data/mockData';

export function useGraphInitialization() {
  const { setNodes, setLinks } = useGraphStore();

  useEffect(() => {
    setNodes(mockNodes);
    setLinks(mockLinks);
  }, [setNodes, setLinks]);
}