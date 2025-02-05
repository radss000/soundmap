'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import * as THREE from 'three';

// Import ForceGraph3D dynamiquement mais avec les bonnes options
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d').then((mod) => mod.default),
  { ssr: false }
);

const NODE_COLORS = {
  release: '#4CAF50',
  artist: '#FF4081',
  label: '#00BCD4',
  cluster: '#FFC107'
};

const INITIAL_CAMERA_Z = 1000;

interface Props {
  searchTerm?: string;
  selectedStyles?: string[];
}

export default function GraphVisualization({ searchTerm = '', selectedStyles = [] }: Props) {
  const fgRef = useRef<any>();
  const workerRef = useRef<Worker>();
  const [data, setData] = useState<{ nodes: any[]; links: any[]; }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      workerRef.current = new Worker(
        new URL('./graphWorker.ts', import.meta.url)
      );
      
      workerRef.current.onmessage = (event) => {
        const { type, data: responseData } = event.data;
        console.log('Worker response:', type, responseData);
        
        switch (type) {
          case 'NODES_PROCESSED':
          case 'NODES_UPDATED':
            setData(responseData);
            setLoading(false);
            break;
          case 'ERROR':
            console.error('Worker error:', responseData);
            setError(responseData);
            setLoading(false);
            break;
        }
      };

      // Load initial data
      fetch('/api/releases/2008')
        .then(res => res.json())
        .then(releases => {
          console.log('Fetched releases:', releases.length);
          if (workerRef.current) {
            workerRef.current.postMessage({
              type: 'INIT',
              data: releases
            });
          }
        })
        .catch(err => {
          console.error('Failed to load releases:', err);
          setError('Failed to load data');
          setLoading(false);
        });

    } catch (error) {
      console.error('Failed to initialize worker:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize');
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);

    if (!fgRef.current || !node?.x) return;
    
    const distance = 200;
    const position = new THREE.Vector3(node.x, node.y, node.z);
    const normal = position.clone().normalize();
    const cameraPosition = normal.multiplyScalar(distance).add(position);
    
    fgRef.current.cameraPosition(
      cameraPosition,
      position, // lookAt
      2000  // transition duration (ms)
    );
  }, []);

  // Graph configuration
  const graphConfig = {
    nodeLabel: (node: any) => `${node.name}\n${node.data?.artistNames?.join(', ') || ''}`,
    nodeColor: (node: any) => NODE_COLORS[node.type] || '#ffffff',
    nodeVal: (node: any) => node.type === 'cluster' ? 8 : 5,
    nodeOpacity: 0.75,
    linkWidth: 2,
    linkOpacity: 0.2,
    backgroundColor: '#000000',
    width: window.innerWidth,
    height: window.innerHeight,
    showNavInfo: false,
    nodeThreeObject: (node: any) => {
      const geometry = new THREE.SphereGeometry(node.type === 'cluster' ? 8 : 5);
      const material = new THREE.MeshPhongMaterial({
        color: NODE_COLORS[node.type] || '#ffffff',
        transparent: true,
        opacity: 0.75,
        shininess: 100
      });
      return new THREE.Mesh(geometry, material);
    },
    linkDirectionalParticles: 2,
    linkDirectionalParticleWidth: 2,
    linkDirectionalParticleSpeed: 0.005,
    d3Force: (d3Force: any) => {
      if (!d3Force) return;
      
      // Adjust forces for better stability
      d3Force.force('charge')?.strength(-100);
      d3Force.force('link')
        ?.distance(50)
        ?.strength(0.3);
      d3Force.force('center')?.strength(0.05);
      
      // Add some damping
      d3Force.velocityDecay(0.3);
    }
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6 bg-black/80 text-white">
          <h3 className="text-xl font-bold text-red-500">Error</h3>
          <p className="mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6 bg-black/80 text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 border-4 border-t-blue-500 rounded-full animate-spin"/>
            <p>Loading visualization...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {data.nodes.length > 0 && (
        <>
          <ForceGraph3D
            ref={fgRef}
            graphData={data}
            {...graphConfig}
            onNodeClick={handleNodeClick}
          />
          {selectedNode && (
            <Card className="absolute top-4 right-4 p-4 w-96 bg-black/80 backdrop-blur-sm text-white">
              <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
              <div className="space-y-2">
                <p className="text-gray-300">Type: {selectedNode.type}</p>
                {selectedNode.data?.artistNames && (
                  <p className="text-gray-300">
                    Artists: {selectedNode.data.artistNames.join(', ')}
                  </p>
                )}
                {selectedNode.data?.labelName && (
                  <p className="text-gray-300">
                    Label: {selectedNode.data.labelName}
                  </p>
                )}
                {selectedNode.data?.styles && (
                  <p className="text-gray-300">
                    Styles: {selectedNode.data.styles.join(', ')}
                  </p>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}