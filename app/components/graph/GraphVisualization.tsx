'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { GraphNode, GraphLink } from '@/lib/types/graph';
import * as THREE from 'three';
import { debounce } from 'lodash';

const VISIBLE_RADIUS = 100;
const BATCH_SIZE = 1000;

const ForceGraph = dynamic(() => import('./ForceGraph'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <Card className="p-4 bg-black/80 backdrop-blur-sm text-white">
        Loading graph engine...
      </Card>
    </div>
  )
});

interface GraphVisualizationProps {
  searchTerm?: string;
  selectedStyles?: string[];
}

export default function GraphVisualization({ 
  searchTerm = '', 
  selectedStyles = [] 
}: GraphVisualizationProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const workerRef = useRef<Worker>();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeWorker = async () => {
      try {
        workerRef.current = new Worker(
          new URL('./graphWorker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (event) => {
          const { type, data } = event.data;
          switch (type) {
            case 'NODES_PROCESSED':
            case 'NODES_UPDATED':
              setNodes(data.nodes);
              setLinks(data.links);
              setLoading(false);
              break;
            case 'NODE_DETAILS':
              setSelectedNode(data);
              break;
            case 'ERROR':
              console.error('Worker error:', data);
              setError(data);
              setLoading(false);
              break;
          }
        };

        await loadInitialData();
      } catch (error) {
        console.error('Failed to initialize worker:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize visualization');
        setLoading(false);
      }
    };

    initializeWorker();

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const response = await fetch('/api/releases/2008');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const releases = await response.json();
      
      if (!releases || !Array.isArray(releases)) {
        throw new Error('Invalid data format received from server');
      }

      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'INIT',
          data: releases
        });
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setLoading(false);
    }
  };

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    if (!workerRef.current) return;
  
    workerRef.current.postMessage({
      type: 'LOAD_NODE_DETAILS',
      nodeId: node.id
    });
  }, []);

  const handleCameraMove = useCallback(
    debounce((position: THREE.Vector3) => {
      if (!workerRef.current) return;
      
      workerRef.current.postMessage({
        type: 'UPDATE_VISIBLE',
        position: { x: position.x, y: position.y, z: position.z },
        radius: VISIBLE_RADIUS
      });
    }, 100),
    []
  );

  useEffect(() => {
    if (!workerRef.current) return;

    workerRef.current.postMessage({
      type: 'FILTER',
      searchTerm,
      selectedStyles
    });
  }, [searchTerm, selectedStyles]);

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Card className="p-4 bg-black/80 backdrop-blur-sm text-white">
          <h3 className="text-xl font-bold text-red-500 mb-2">Error</h3>
          <p className="text-sm text-gray-300">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              loadInitialData();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Card className="p-4 bg-black/80 backdrop-blur-sm text-white">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mb-4" />
            <p>Loading visualization...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <ForceGraph
        nodes={nodes}
        links={links}
        onNodeClick={handleNodeClick}
        onCameraMove={handleCameraMove}
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