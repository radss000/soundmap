'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { useGraphStore } from '@/lib/store/graphStore';
import { createNodeObject } from './nodes/NodeObject';
import { useGraphInitialization } from './hooks/useGraphInitialization';

// Import dynamique de ForceGraph3D
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false
});

export default function GraphVisualization() {
  const graphRef = useRef();
  const { nodes, links, setSelectedNode } = useGraphStore();
  
  useGraphInitialization();

  if (typeof window === 'undefined') return null;

  return (
    <div className="w-full h-screen bg-background">
      <ForceGraph3D
        ref={graphRef}
        graphData={{ nodes, links }}
        nodeLabel="name"
        backgroundColor="transparent"
        nodeColor={(node) => node.color}
        nodeVal={(node) => node.size}
        linkColor={() => 'rgba(255, 255, 255, 0.3)'}
        linkWidth={1}
        linkOpacity={0.2}
        onNodeClick={(node) => setSelectedNode(node)}
        nodeThreeObject={createNodeObject}
        nodeThreeObjectExtend={false}
      />
    </div>
  );
}