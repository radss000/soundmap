'use client';
import dynamic from 'next/dynamic';

const GraphVisualization = dynamic(
  () => import('@/app/components/graph/GraphVisualization'),
  { ssr: false }
);

export default function ReleasesPage() {
  return <GraphVisualization />;
}

