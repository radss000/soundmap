'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';

// Dynamic import with proper loading state
const GraphVisualization = dynamic(
  () => import('@/app/components/graph/GraphVisualization'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <Card className="p-6 bg-black/50 backdrop-blur-sm text-white">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-48 bg-gray-700 rounded"></div>
            <div className="mt-4">Loading sound map visualization...</div>
          </div>
        </Card>
      </div>
    )
  }
);

export default function ReleasesPage() {
  return (
    <div className="w-full h-screen overflow-hidden bg-black">
      <Suspense fallback={
        <div className="w-full h-screen flex items-center justify-center bg-black">
          <Card className="p-6 bg-black/50 backdrop-blur-sm text-white">
            <div className="animate-pulse">Loading sound map...</div>
          </Card>
        </div>
      }>
        <GraphVisualization />
      </Suspense>
    </div>
  );
}