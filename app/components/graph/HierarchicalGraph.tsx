'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { debounce } from 'lodash';

// Import dynamique pour éviter les erreurs SSR
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
  ssr: false 
});

const HierarchicalGraph = () => {
  const graphRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [viewDistance, setViewDistance] = useState(1000);
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    loadClusterData();
  }, []);

  const highlightRelatedNodes = (node) => {
    const relatedNodeIds = new Set(graphData.links
      .filter(link => link.source.id === node.id || link.target.id === node.id)
      .flatMap(link => [link.source.id, link.target.id]));
      
    setGraphData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => ({
        ...n,
        opacity: relatedNodeIds.has(n.id) ? 1 : 0.2
      }))
    }));
  };

  const loadClusterData = useCallback(async (clusterId = null) => {
    try {
      const response = await fetch(`/api/releases/cluster/${clusterId || 'root'}`);
      const data = await response.json();
      
      const nodes = data.nodes.map(node => ({
        ...node,
        cluster: node.type === 'cluster',
        r: node.type === 'cluster' ? 8 : 4,
        color: getNodeColor(node)
      }));
      
      setGraphData(prev => ({
        nodes: selectedCluster ? [...prev.nodes, ...nodes] : nodes,
        links: data.links
      }));
    } catch (error) {
      console.error('Error loading cluster data:', error);
    }
  }, [selectedCluster]);

  const handleNodeClick = useCallback(node => {
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    graphRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      2000
    );

    if (node.cluster) {
      setSelectedCluster(node.id);
      loadClusterData(node.id);
    } else {
      highlightRelatedNodes(node);
    }
  }, [loadClusterData]);

  const getNodeColor = node => {
    if (node.cluster) return 'rgba(255, 255, 255, 0.8)';
    switch (node.type) {
      case 'artist': return 'rgb(255, 64, 129)';
      case 'label': return 'rgb(0, 188, 212)';
      case 'release': return 'rgb(76, 175, 80)';
      default: return 'rgb(158, 158, 158)';
    }
  };

  return (
    <div className="w-full h-screen bg-black">
      {typeof window !== 'undefined' && (
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData}
          nodeLabel={node => node.name}
          nodeColor={node => node.color}
          nodeRelSize={node => node.r}
          nodeResolution={16}
          linkWidth={1}
          linkOpacity={0.2}
          backgroundColor="#000000"
          showNavInfo={false}
          onNodeClick={handleNodeClick}
          onNodeRightClick={node => {
            graphRef.current.cameraPosition(
              { x: 0, y: 0, z: viewDistance },
              { x: 0, y: 0, z: 0 },
              2000
            );
            setSelectedCluster(null);
          }}
          nodeThreeObject={node => {
            if (!node.cluster) return null;
            
            const sprite = new THREE.Sprite(
              new THREE.SpriteMaterial({
                map: new THREE.TextureLoader().load('/cluster-glow.png'),
                color: node.color,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
              })
            );
            sprite.scale.set(40, 40, 1);
            return sprite;
          }}
        />
      )}
    </div>
  );
};

export default HierarchicalGraph;