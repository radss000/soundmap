'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';

// Import BubbleVisualization dynamically to avoid SSR issues
const BubbleVisualization = dynamic(
  () => import('@/app/components/graph/BubbleVisualization'),
  { 
    ssr: false,
    loading: () => (
      <Card className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900 text-white">
        <p className="text-lg">Loading visualization...</p>
      </Card>
    )
  }
);

export default function ReleasesPage() {
  return (
    <Suspense>
      <BubbleVisualization />
    </Suspense>
  );
}