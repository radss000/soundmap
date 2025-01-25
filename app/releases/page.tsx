'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { processReleaseData } from '@/lib/services/clustering';

const OptimizedGraph = dynamic(
  () => import('@/app/components/graph/OptimizedGraph'),
  { ssr: false }
);

export default function ReleasesPage() {
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    async function fetchReleases() {
      try {
        const response = await fetch('/api/releases/2008');
        const releases = await response.json();
        
        // Transformer les données pour le graphe
        const processedData = processReleaseData(releases);
        setGraphData(processedData);
      } catch (error) {
        console.error('Error fetching releases:', error);
      }
    }

    fetchReleases();
  }, []);

  if (!graphData) {
    return (
      <Card className="w-full h-screen flex items-center justify-center">
        <p className="text-lg">Loading releases...</p>
      </Card>
    );
  }

  return <OptimizedGraph data={graphData} initialFocus="electronic" />;
}