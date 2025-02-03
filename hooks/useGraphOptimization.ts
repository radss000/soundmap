import { useState, useCallback, useEffect } from 'react';
import { GraphNode, GraphLink } from '@/lib/types/graph';
import { debounce } from 'lodash';

const VISIBLE_RADIUS = 100;
const CHUNK_SIZE = 1000;

export function useGraphOptimization(worker: Worker | undefined) {
  const [optimizedNodes, setOptimizedNodes] = useState<GraphNode[]>([]);
  const [optimizedLinks, setOptimizedLinks] = useState<GraphLink[]>([]);
  const [clusterData, setClusterData] = useState<any[]>([]);
  const [loadedNodes] = useState(new Set<string>());

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (!worker) return;
    
    worker.postMessage({
      type: node.type === 'cluster' ? 'EXPAND_CLUSTER' : 'LOAD_NODE_DETAILS',
      nodeId: node.id
    });
  }, [worker]);

  const handleCameraMove = useCallback(
    debounce((position: { x: number; y: number; z: number }) => {
      if (!worker) return;

      worker.postMessage({
        type: 'UPDATE_VISIBLE',
        position,
        radius: VISIBLE_RADIUS
      });
    }, 100),
    [worker]
  );

  useEffect(() => {
    if (!worker) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'NODES_UPDATED':
          setOptimizedNodes(data.nodes);
          setOptimizedLinks(data.links);
          break;
        case 'CLUSTERS_UPDATED':
          setClusterData(data);
          break;
      }
    };

    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, [worker]);

  return {
    optimizedNodes,
    optimizedLinks,
    clusterData,
    handleNodeClick,
    handleCameraMove
  };
}