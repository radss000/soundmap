// app/components/GraphVisualization/index.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { GraphNode, GraphLink } from '@/lib/types/graph';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useGraphOptimization } from '@/hooks/useGraphOptimization';
import { Card } from '@/components/ui/card';

const ForceGraph = dynamic(() => import('./ForceGraph'), { 
  ssr: false,
  loading: () => <LoadingSpinner />
});

const BATCH_SIZE = 1000;

interface GraphVisualizationProps {
  initialData?: { nodes: GraphNode[]; links: GraphLink[] };
}

export default function GraphVisualization({ initialData }: GraphVisualizationProps) {
  const [data, setData] = useState(initialData);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const workerRef = useRef<Worker>();
  
  const { 
    optimizedNodes,
    optimizedLinks,
    clusterData,
    handleNodeClick,
    handleCameraMove
  } = useGraphOptimization(workerRef.current);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(
        new URL('./graphWorker.ts', import.meta.url)
      );
      
      workerRef.current.onmessage = (event) => {
        const { type, data } = event.data;
        switch (type) {
          case 'NODES_PROCESSED':
            setData(data);
            setLoading(false);
            break;
          case 'NODE_DETAILS':
            setSelectedNode(data);
            break;
          case 'ERROR':
            console.error('Worker error:', data);
            break;
        }
      };

      return () => workerRef.current?.terminate();
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/releases/2008');
      const releases = await response.json();
      
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'INIT',
          data: releases.slice(0, BATCH_SIZE)
        });
      }
    } catch (error) {
      console.error('Failed to load graph data:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      loadData();
    }
  }, [initialData, loadData]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="relative w-full h-screen bg-background">
      <ForceGraph 
        nodes={optimizedNodes}
        links={optimizedLinks}
        clusters={clusterData}
        onNodeClick={handleNodeClick}
        onCameraMove={handleCameraMove}
      />
      
      {selectedNode && (
        <Card className="absolute top-4 right-4 p-4 w-96 bg-black/80 backdrop-blur-sm text-white border-none">
          <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-300">Type: {selectedNode.type}</p>
            {selectedNode.data?.artistNames && (
              <p className="text-sm text-gray-300">
                Artists: {selectedNode.data.artistNames.join(', ')}
              </p>
            )}
            {selectedNode.data?.labelName && (
              <p className="text-sm text-gray-300">
                Label: {selectedNode.data.labelName}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}