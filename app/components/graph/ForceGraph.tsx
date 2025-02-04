'use client';

import React from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';

interface ForceGraphProps {
  data: any;
  onNodeClick?: (node: any) => void;
  onLinkClick?: (link: any) => void;
}

const ForceGraph = React.forwardRef<any, ForceGraphProps>(({ data, onNodeClick, onLinkClick }, ref) => {
  return (
    <ForceGraph3D
      ref={ref}
      graphData={data}
      nodeLabel={node => `${node.name}\n${node.data?.artistNames?.join(', ') || ''}`}
      nodeColor={node => {
        switch (node.type) {
          case 'release':
            return '#4CAF50';
          case 'artist':
            return '#FF4081';
          case 'label':
            return '#00BCD4';
          case 'cluster':
            return '#FFC107';
          default:
            return '#ffffff';
        }
      }}
      nodeVal={node => node.type === 'cluster' ? 8 : 5}
      nodeOpacity={0.75}
      linkWidth={2}
      linkOpacity={0.2}
      backgroundColor="#000000"
      width={window.innerWidth}
      height={window.innerHeight}
      showNavInfo={false}
      onNodeClick={onNodeClick}
      onLinkClick={onLinkClick}
      nodeThreeObject={node => {
        const geometry = new THREE.SphereGeometry(
          node.type === 'cluster' ? 8 : 5
        );
        const material = new THREE.MeshPhongMaterial({
          color: node.color || '#ffffff',
          transparent: true,
          opacity: 0.75,
          shininess: 100
        });
        return new THREE.Mesh(geometry, material);
      }}
      linkDirectionalParticles={2}
      linkDirectionalParticleWidth={2}
      linkDirectionalParticleSpeed={0.005}
      d3Force={(d3Force: any) => {
        d3Force.force('charge').strength(-50);
        d3Force.force('link').distance(50);
        d3Force.force('center').strength(0.05);
      }}
    />
  );
});

ForceGraph.displayName = 'ForceGraph';

export default ForceGraph;