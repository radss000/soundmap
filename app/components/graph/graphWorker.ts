'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import * as THREE from 'three';

const NODE_COLORS = {
  release: '#4CAF50',
  artist: '#FF4081',
  label: '#00BCD4',
  cluster: '#FFC107'
};

const VISIBLE_RADIUS = 100;
const BATCH_SIZE = 1000;

const ForceGraph = dynamic(
  () => import('./ForceGraph'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6 bg-black/80 text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 border-4 border-t-blue-500 rounded-full animate-spin"/>
            <p>Loading graph engine...</p>
          </div>
        </Card>
      </div>
    )
  }
);

type Props = {
  searchTerm?: string;
  selectedStyles?: string[];
};

export default function GraphVisualization({
  searchTerm = '',
  selectedStyles = []
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ nodes: any[]; links: any[]; }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const workerRef = useRef<Worker>();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeWorker = async () => {
      try {
        workerRef.current = new Worker(
          new URL('./graphWorker.ts', import.meta.url)
        );
        
        workerRef.current.onmessage = (event) => {
          const { type, data: responseData } = event.data;
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

        const response = await fetch('/api/releases/2008');
        const releases = await response.json();

        workerRef.current.postMessage({
          type: 'INIT',
          data: releases
        });

      } catch (error) {
        console.error('Failed to initialize visualization:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize');
        setLoading(false);
      }
    };

    initializeWorker();

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Effect pour gérer les changements de filtres
  useEffect(() => {
    if (!workerRef.current) return;
    
    console.log('Sending filter update:', { searchTerm, selectedStyles });
    
    workerRef.current.postMessage({
      type: 'FILTER',
      data: {
        searchTerm: searchTerm || '',
        selectedStyles: selectedStyles || []
      }
    });
  }, [searchTerm, selectedStyles]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);

    if (!node?.position) return;
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.position.x, node.position.y, node.position.z);
  }, []);

  const handleCameraMove = useCallback((camera: THREE.Camera) => {
    if (!workerRef.current || !camera) return;

    workerRef.current.postMessage({
      type: 'UPDATE_VISIBLE',
      data: {
        position: camera.position,
        radius: VISIBLE_RADIUS
      }
    });
  }, []);

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
            <p>Initializing visualization...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black">
      <ForceGraph
        data={data}
        onNodeClick={handleNodeClick}
        onCameraMove={handleCameraMove}
        nodeColors={NODE_COLORS}
      />

      {selectedNode && (
        <Card className="absolute top-4 right-4 p-4 w-96 bg-black/80 backdrop-blur-sm text-white border-none">
          <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-300">Type: {selectedNode.type}</p>
            {selectedNode.data?.artistNames && (
              <p className="text-sm text-gray-300">
                Artists: {selectedNode.data.artistNames.join(', ')}
              </p>
            )}
            {selectedNode.data?.labelName && (
              <p className="text-sm text-gray-300">
                Label: {selectedNode.data.labelName}
              </p>
            )}
            {selectedNode.data?.styles && (
              <p className="text-sm text-gray-300">
                Styles: {selectedNode.data.styles.join(', ')}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}