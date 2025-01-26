'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { Card } from '@/components/ui/card';

const GraphVisualization = dynamic(
  () => import('@/components/graph/GraphVisualization'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center">
        <Card className="p-4 bg-background/80 backdrop-blur-sm">
          Loading visualization...
        </Card>
      </div>
    )
  }
);

export default function ExplorePage() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
        <SearchBar />
        <FilterPanel />
      </div>
      <GraphVisualization />
    </div>
  );
}