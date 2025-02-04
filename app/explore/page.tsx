'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

// Lazy load the Force Graph component
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d'),
  { ssr: false }
);

const NODE_COLORS = {
  release: '#4CAF50',
  artist: '#FF4081',
  label: '#00BCD4',
  cluster: '#FFC107'
};

export default function ExplorePage() {
  const { theme } = useTheme();
  const graphRef = useRef();
  const workerRef = useRef<Worker>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    workerRef.current = new Worker(
      new URL('@/components/graph/graphWorker.ts', import.meta.url)
    );

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      switch (type) {
        case 'NODES_PROCESSED':
        case 'NODES_UPDATED':
          setData(data);
          setLoading(false);
          break;
        case 'ERROR':
          console.error('Worker error:', data);
          setError(data);
          setLoading(false);
          break;
      }
    };

    workerRef.current.onmessage = handleMessage;

    // Load initial data
    fetch('/api/releases/2008')
      .then(res => res.json())
      .then(releases => {
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

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'FILTER',
        data: {
          searchTerm: term,
          selectedStyles
        }
      });
    }
  }, [selectedStyles]);

  const handleFilterChange = useCallback((styles: string[]) => {
    setSelectedStyles(styles);
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'FILTER',
        data: {
          searchTerm,
          selectedStyles: styles
        }
      });
    }
  }, [searchTerm]);

  const handleCameraMove = useCallback((position: THREE.Vector3) => {
    if (!workerRef.current) return;
    
    workerRef.current.postMessage({
      type: 'UPDATE_VISIBLE',
      data: {
        position: { x: position.x, y: position.y, z: position.z },
        radius: 100
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

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
        <SearchBar onSearch={handleSearch} />
        <FilterPanel 
          onFilterChange={handleFilterChange}
          styles={Array.from(new Set(data.nodes.flatMap(n => n.data?.styles || [])))}
        />
      </div>
      
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <Card className="p-6 bg-black/80 text-white">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 border-4 border-t-blue-500 rounded-full animate-spin"/>
              <p>Loading visualization...</p>
            </div>
          </Card>
        </div>
      }>
        {!loading && (
          <ForceGraph3D
            ref={graphRef}
            graphData={data}
            nodeLabel={node => `${node.name}\n${node.data?.artistNames?.join(', ') || ''}`}
            nodeColor={node => NODE_COLORS[node.type] || '#ffffff'}
            nodeVal={node => node.type === 'cluster' ? 8 : 5}
            nodeOpacity={0.75}
            linkWidth={2}
            linkOpacity={0.2}
            backgroundColor={theme === 'dark' ? '#000000' : '#ffffff'}
            width={window.innerWidth}
            height={window.innerHeight}
            showNavInfo={false}
            onNodeClick={(node) => {
              if (!graphRef.current) return;
              
              const distance = 40;
              const position = node as any;
              const distRatio = 1 + distance/Math.hypot(position.x, position.y, position.z);

              (graphRef.current as any).cameraPosition(
                { 
                  x: position.x * distRatio, 
                  y: position.y * distRatio, 
                  z: position.z * distRatio 
                },
                position,
                2000
              );
            }}
            onNodeDragEnd={node => {
              node.fx = undefined;
              node.fy = undefined;
              node.fz = undefined;
            }}
            onEngineStop={() => {
              const camera = (graphRef.current as any)?.camera();
              if (camera) {
                handleCameraMove(camera.position);
              }
            }}
            nodeThreeObject={node => {
              const geometry = new THREE.SphereGeometry(
                node.type === 'cluster' ? 8 : 5
              );
              const material = new THREE.MeshPhongMaterial({
                color: NODE_COLORS[node.type] || '#ffffff',
                transparent: true,
                opacity: 0.75,
                shininess: 100
              });
              return new THREE.Mesh(geometry, material);
            }}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.005}
            d3Force={(d3Force) => {
              d3Force.force('charge').strength(-50);
              d3Force.force('link').distance(50);
              d3Force.force('center').strength(0.05);
            }}
          />
        )}
      </Suspense>
    </div>
  );
}