'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import ForceGraph from '@/components/graph/ForceGraph';

export default function ReleasesPage() {
  const [data, setData] = useState<{ nodes: any[]; links: any[]; }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker>();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    workerRef.current = new Worker(
      new URL('@/components/graph/graphWorker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (event) => {
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
    <div className="h-screen w-full bg-black">
      <ForceGraph 
        data={data}
        onNodeClick={(node) => {
          console.log('Clicked node:', node);
        }}
        onCameraMove={(position) => {
          if (workerRef.current) {
            workerRef.current.postMessage({
              type: 'UPDATE_VISIBLE',
              data: {
                position,
                radius: 100
              }
            });
          }
        }}
      />
    </div>
  );
}