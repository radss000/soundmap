// app/components/graph/GraphVisualization/workers/graphWorker.ts
import { GraphNode, GraphLink } from '@/lib/types/graph';

const CHUNK_SIZE = 1000;

interface WorkerMessage {
  type: 'PROCESS_NODES' | 'CALCULATE_CLUSTERS';
  data: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  switch (type) {
    case 'PROCESS_NODES':
      const chunks = chunkNodes(data.nodes);
      self.postMessage({ type: 'CHUNKS_READY', data: chunks });
      break;

    case 'CALCULATE_CLUSTERS':
      const clusters = calculateClusters(data.nodes, data.links);
      self.postMessage({ type: 'CLUSTERS_READY', data: clusters });
      break;
  }
};

function chunkNodes(nodes: GraphNode[]) {
  return nodes.reduce((chunks: GraphNode[][], node, index) => {
    const chunkIndex = Math.floor(index / CHUNK_SIZE);
    if (!chunks[chunkIndex]) {
      chunks[chunkIndex] = [];
    }
    chunks[chunkIndex].push(node);
    return chunks;
  }, []);
}

function calculateClusters(nodes: GraphNode[], links: GraphLink[]) {
  // Implementation of clustering algorithm
  const clusters = new Map();
  
  // Group nodes by type and properties
  nodes.forEach(node => {
    const clusterKey = getClusterKey(node);
    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, []);
    }
    clusters.get(clusterKey).push(node);
  });

  return Array.from(clusters.entries()).map(([key, nodes]) => ({
    id: key,
    nodes,
    size: nodes.length,
    center: calculateClusterCenter(nodes)
  }));
}

function getClusterKey(node: GraphNode): string {
  // Implement clustering logic based on node properties
  return `${node.type}-${node.color}`;
}

function calculateClusterCenter(nodes: GraphNode[]) {
  // Calculate geometric center of nodes
  const sum = nodes.reduce(
    (acc, node) => ({
      x: acc.x + (node.x || 0),
      y: acc.y + (node.y || 0),
      z: acc.z + (node.z || 0)
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / nodes.length,
    y: sum.y / nodes.length,
    z: sum.z / nodes.length
  };
}

export {};