'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import * as THREE from 'three';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

const NODE_COLORS = {
  release: '#4CAF50',
  artist: '#FF4081',
  label: '#00BCD4',
  cluster: '#FFC107'
};

const VISIBLE_RADIUS = 100;

interface Props {
  searchTerm?: string;
  selectedStyles?: string[];
}

export default function GraphVisualization({
  searchTerm = '',
  selectedStyles = []
}: Props) {
  const graphRef = useRef();
  const workerRef = useRef<Worker>();
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

      // Load initial data
      fetch('/api/releases/2008')
        .then(res => res.json())
        .then(releases => {
          if (!workerRef.current) return;
          workerRef.current.postMessage({
            type: 'INIT',
            data: releases
          });
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

  useEffect(() => {
    if (!workerRef.current) return;

    workerRef.current.postMessage({
      type: 'FILTER',
      data: {
        searchTerm: searchTerm || '',
        selectedStyles: selectedStyles || []
      }
    });
  }, [searchTerm, selectedStyles]);

  const handleCameraMove = useCallback((position: THREE.Vector3) => {
    if (!workerRef.current) return;
    
    workerRef.current.postMessage({
      type: 'UPDATE_VISIBLE',
      data: {
        position: {
          x: position.x,
          y: position.y,
          z: position.z
        },
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
            <p>Loading visualization...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {data.nodes.length > 0 && (
        <ForceGraph3D
          ref={graphRef}
          graphData={data}
          nodeLabel={node => `${node.name}\n${node.data?.artistNames?.join(', ') || ''}`}
          nodeColor={node => NODE_COLORS[node.type] || '#ffffff'}
          nodeVal={node => node.type === 'cluster' ? 8 : 5}
          nodeOpacity={0.75}
          backgroundColor="#000000"
          showNavInfo={false}
          onEngineStop={() => {
            const camera = (graphRef.current as any)?.camera();
            if (camera) {
              handleCameraMove(camera.position);
            }
          }}
        />
      )}
    </div>
  );
}