'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { Card } from '@/components/ui/card';
import { useCallback, useState } from 'react';

// Lazy load the graph visualization
const GraphVisualization = dynamic(
  () => import('@/components/graph/GraphVisualization'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center">
        <Card className="p-4 bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin"/>
            <p>Loading visualization...</p>
          </div>
        </Card>
      </div>
    )
  }
);

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleFilterChange = useCallback((styles: string[]) => {
    setSelectedStyles(styles);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
        <SearchBar onSearch={handleSearch} />
        <FilterPanel 
          onFilterChange={handleFilterChange}
          styles={[
            'Deep House',
            'Tech House',
            'Techno',
            'Ambient',
            'Drum & Bass',
            'Dubstep',
            'House',
          ]} // Ces styles seront dynamiquement chargés depuis les données
        />
      </div>
      
      <Suspense 
        fallback={
          <div className="w-full h-screen flex items-center justify-center">
            <Card className="p-4 bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin"/>
                <p>Initializing visualization...</p>
              </div>
            </Card>
          </div>
        }
      >
        <GraphVisualization 
          searchTerm={searchTerm} 
          selectedStyles={selectedStyles}
        />
      </Suspense>
    </div>
  );
}