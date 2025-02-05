'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { NodePopup } from './popups/NodePopup';
import { ForceGraphProps, GraphNode, NodeClickEvent } from './types';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

const NODE_COLORS = {
  release: '#4CAF50',
  artist: '#FF4081',
  label: '#00BCD4',
  cluster: '#FFC107',
  track: '#9C27B0'
};

const ForceGraph: React.FC<ForceGraphProps> = ({
  data,
  onNodeClick,
  onCameraMove,
  nodeColors = NODE_COLORS,
}) => {
  const graphRef = useRef<any>();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const handleNodeClick = useCallback((node: GraphNode, event: MouseEvent) => {
    // Mise à jour de la position de la popup
    setPopupPosition({
      x: event.clientX,
      y: event.clientY
    });
    setSelectedNode(node);

    // Si c'est un cluster, on transmet l'événement pour expansion
    if (node.type === 'cluster') {
      onNodeClick?.({
        node,
        event,
        camera: graphRef.current?.camera(),
        pointer: { x: event.clientX, y: event.clientY }
      });
      
      // Zoom adapté pour les clusters
      const pos = node.__threeObj?.position;
      if (pos && graphRef.current) {
        graphRef.current.cameraPosition(
          {
            x: pos.x,
            y: pos.y,
            z: pos.z + 200 // Distance plus grande pour voir tout le contenu
          },
          pos,
          2000
        );
      }
    }
  }, [onNodeClick]);

  const expandCluster = useCallback((node: GraphNode) => {
    if (node.type === 'cluster' && onNodeClick) {
      onNodeClick({
        node,
        event: new MouseEvent('click', {}),
        camera: graphRef.current?.camera(),
        pointer: popupPosition
      });
    }
  }, [onNodeClick, popupPosition]);

  return (
    <>
      <ForceGraph3D
        ref={graphRef}
        graphData={data}
        nodeLabel={node => `${node.name}\n${node.type === 'release' ? node.data?.artistNames?.join(', ') : ''}`}
        nodeColor={node => nodeColors[node.type] || '#ffffff'}
        nodeVal={node => {
          switch(node.type) {
            case 'cluster': return Math.sqrt(node.data?.count || 20) * 2;
            case 'release': return 5;
            case 'artist': return 8;
            case 'label': return 8;
            default: return 4;
          }
        }}
        nodeOpacity={0.8}
        linkWidth={1.5}
        linkOpacity={0.3}
        backgroundColor="#000000"
        width={window.innerWidth}
        height={window.innerHeight}
        showNavInfo={false}
        onNodeClick={handleNodeClick}
        nodeThreeObject={node => {
          const size = node.type === 'cluster' ? 
            Math.sqrt(node.data?.count || 20) * 2 :
            node.type === 'release' ? 5 :
            node.type === 'artist' ? 8 :
            node.type === 'label' ? 8 : 4;

          const geometry = new THREE.SphereGeometry(size, 16, 16);
          const material = new THREE.MeshPhongMaterial({
            color: nodeColors[node.type] || '#ffffff',
            transparent: true,
            opacity: 0.8,
            shininess: 100
          });
          return new THREE.Mesh(geometry, material);
        }}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.003}
        d3Force={(d3) => {
          d3.force('charge').strength(-50);
          d3.force('link').distance(40);
          d3.force('center').strength(0.05);
        }}
      />

      {selectedNode && (
        <NodePopup
          node={selectedNode}
          position={popupPosition}
          onClose={() => setSelectedNode(null)}
          onExpandCluster={() => expandCluster(selectedNode)}
        />
      )}
    </>
  );
};

export default ForceGraph;