import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, ZoomIn, ZoomOut } from 'lucide-react';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

const COLOR_SCHEME = {
  genre: new THREE.Color('#2196F3'),
  subgenre: new THREE.Color('#4CAF50'),
  artist: new THREE.Color('#FF4081'),
  label: new THREE.Color('#FFC107'),
  release: new THREE.Color('#9C27B0'),
  default: new THREE.Color('#9E9E9E')
};

const calculateNodeSize = (node) => {
  const baseSizes = {
    genre: 20,
    subgenre: 15,
    artist: 10,
    label: 12,
    release: 8
  };
  return baseSizes[node.type] || 10;
};

const GraphVisualization = () => {
  const graphRef = useRef();
  const [data, setData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/releases/2008');
        const releases = await response.json();
        
        const nodes = releases.map(release => ({
          id: release.id,
          name: release.title,
          type: 'release',
          val: calculateNodeSize({ type: 'release' }),
          color: COLOR_SCHEME.release,
          data: release
        }));

        const links = [];
        for (let i = 0; i < nodes.length - 1; i++) {
          if (nodes[i].data.labelName === nodes[i + 1].data.labelName) {
            links.push({
              source: nodes[i].id,
              target: nodes[i + 1].id,
              value: 1
            });
          }
        }

        setData({ nodes, links });
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize graph:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNodeClick = useCallback(node => {
    if (!node || !graphRef.current) return;
    
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    graphRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      2000
    );

    setSelectedNode(node);
  }, []);

  const handleResetView = useCallback(() => {
    if (!graphRef.current) return;
    graphRef.current.cameraPosition(
      { x: 0, y: 0, z: 300 },
      { x: 0, y: 0, z: 0 },
      2000
    );
    setSelectedNode(null);
  }, []);

  const handleZoom = useCallback((factor) => {
    if (!graphRef.current) return;
    const { x, y, z } = graphRef.current.cameraPosition();
    graphRef.current.cameraPosition(
      { x: x * factor, y: y * factor, z: z * factor },
      { x: 0, y: 0, z: 0 },
      1000
    );
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        Loading visualization...
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-background via-background/80 to-background/60">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-4">
        <Button 
          variant="outline" 
          className="bg-background/80 backdrop-blur-sm"
          onClick={handleResetView}>
          <Home className="w-4 h-4 mr-2" />
          Reset View
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-background/80 backdrop-blur-sm"
            onClick={() => handleZoom(0.8)}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            className="bg-background/80 backdrop-blur-sm"
            onClick={() => handleZoom(1.2)}>
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ForceGraph3D
        ref={graphRef}
        graphData={data}
        nodeLabel="name"
        backgroundColor="transparent"
        nodeThreeObject={node => {
          const geometry = new THREE.SphereGeometry(5);
          const material = new THREE.MeshPhongMaterial({
            color: node.color,
            transparent: true,
            opacity: 0.75,
            shininess: 100
          });
          return new THREE.Mesh(geometry, material);
        }}
        nodeThreeObjectExtend={false}
        linkWidth={1}
        linkOpacity={0.2}
        linkDirectionalParticles={1}
        onNodeClick={handleNodeClick}
      />
      
      {selectedNode && (
        <Card className="absolute top-4 right-4 p-4 w-96 bg-background/80 backdrop-blur-sm border-none">
          <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
          <div className="space-y-2 text-muted-foreground">
            {selectedNode.data?.artistNames && (
              <p>Artists: {selectedNode.data.artistNames.join(', ')}</p>
            )}
            {selectedNode.data?.labelName && (
              <p>Label: {selectedNode.data.labelName}</p>
            )}
            {selectedNode.data?.styles && (
              <p>Styles: {selectedNode.data.styles.join(', ')}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default GraphVisualization;