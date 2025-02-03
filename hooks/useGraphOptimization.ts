import { useState, useEffect, useCallback, useRef } from 'react';
import { GraphNode, GraphLink } from '@/lib/types/graph';
import { debounce } from 'lodash';

const VISIBLE_RADIUS = 100;

export function useGraphOptimization(workerRef: React.MutableRefObject<Worker | undefined>) {
  const [optimizedNodes, setOptimizedNodes] = useState<GraphNode[]>([]);
  const [optimizedLinks, setOptimizedLinks] = useState<GraphLink[]>([]);
  const [clusterData, setClusterData] = useState<any[]>([]);

  useEffect(() => {
    if (!workerRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      switch (type) {
        case 'NODES_PROCESSED':
        case 'NODES_UPDATED':
          setOptimizedNodes(data.nodes);
          setOptimizedLinks(data.links);
          break;
        case 'CLUSTERS_UPDATED':
          setClusterData(data);
          break;
      }
    };

    // Using onmessage instead of addEventListener
    workerRef.current.onmessage = handleMessage;

    return () => {
      if (workerRef.current) {
        workerRef.current.onmessage = null;
      }
    };
  }, [workerRef]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (!workerRef.current) return;
    
    workerRef.current.postMessage({
      type: node.type === 'cluster' ? 'EXPAND_CLUSTER' : 'LOAD_NODE_DETAILS',
      nodeId: node.id
    });
  }, []);

  const handleCameraMove = useCallback(
    debounce((position: { x: number; y: number; z: number }) => {
      if (!workerRef.current) return;

      workerRef.current.postMessage({
        type: 'UPDATE_VISIBLE',
        position,
        radius: VISIBLE_RADIUS
      });
    }, 100),
    []
  );

  return {
    optimizedNodes,
    optimizedLinks,
    clusterData,
    handleNodeClick,
    handleCameraMove
  };
}