'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';

const GraphVisualization = dynamic(
  () => import('/Users/admin/Downloads/soundmap/app/components/graph/GraphVisualization.tsx'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6 bg-black/80 text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 border-4 border-t-blue-500 rounded-full animate-spin"/>
            <p>Loading visualization...</p>
          </div>
        </Card>
      </div>
    )
  }
);

export default function ReleasesPage() {
  return (
    <div className="w-full h-screen bg-black relative">
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Card className="p-6 bg-black/80 text-white">
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-4 border-t-blue-500 rounded-full animate-spin"/>
                <p>Loading visualization...</p>
              </div>
            </Card>
          </div>
        }
      >
        <GraphVisualization />
      </Suspense>
    </div>
  );
}