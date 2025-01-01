// app/components/graph/GraphVisualization.tsx
'use client';

import { useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useGraphStore } from '@/lib/store/graphStore';
import { createNodeObject } from './nodes/NodeObject';
import { useGraphInitialization } from './hooks/useGraphInitialization';

export default function GraphVisualization() {
  const graphRef = useRef();
  const { nodes, links, setSelectedNode } = useGraphStore();
  
  useGraphInitialization();

  return (
    <div className="w-full h-screen bg-background">
      <ForceGraph3D
        ref={graphRef}
        graphData={{ nodes, links }}
        nodeLabel="name"
        backgroundColor="rgba(0,0,0,0)"
        nodeColor={(node) => node.color}
        nodeVal={(node) => node.size || 10}
        linkColor={() => 'rgba(255, 255, 255, 0.2)'}
        linkWidth={1}
        linkOpacity={0.2}
        onNodeClick={(node) => setSelectedNode(node)}
        nodeThreeObject={createNodeObject}
        nodeThreeObjectExtend={false}
      />
    </div>
  );
}