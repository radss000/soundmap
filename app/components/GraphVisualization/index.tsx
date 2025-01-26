// app/components/graph/GraphVisualization/index.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { GraphNode, GraphLink } from '@/lib/types/graph';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useGraphOptimization } from './hooks/useGraphOptimization';

const ForceGraph = dynamic(() => import('./ForceGraph'), { 
  ssr: false,
  loading: () => <LoadingSpinner />
});

interface GraphVisualizationProps {
  initialData?: { nodes: GraphNode[]; links: GraphLink[] };
}

export default function GraphVisualization({ initialData }: GraphVisualizationProps) {
  const [data, setData] = useState(initialData);
  const workerRef = useRef<Worker>();
  const { 
    optimizedNodes,
    optimizedLinks,
    clusterData
  } = useGraphOptimization(data);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(
        new URL('./workers/graphWorker.ts', import.meta.url)
      );
      
      return () => workerRef.current?.terminate();
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/releases/2008');
      const releases = await response.json();
      setData(releases);
    } catch (error) {
      console.error('Failed to load graph data:', error);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      loadData();
    }
  }, [initialData, loadData]);

  if (!data) return <LoadingSpinner />;

  return (
    <div className="w-full h-screen">
      <ForceGraph 
        nodes={optimizedNodes}
        links={optimizedLinks}
        clusters={clusterData}
        worker={workerRef.current}
      />
    </div>
  );
}