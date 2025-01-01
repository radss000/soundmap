'use client';

import { Suspense } from 'react';
import GraphVisualization from '@/app/components/graph/GraphVisualization';
import { SearchBar } from '@/app/components/search/SearchBar';
import { FilterPanel } from '@/app/components/search/FilterPanel';
import { NodeDetails } from '@/app/components/graph/NodeDetails';

export default function ExplorePage() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
        <SearchBar />
        <FilterPanel />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <GraphVisualization />
      </Suspense>
      <NodeDetails />
    </div>
  );
}