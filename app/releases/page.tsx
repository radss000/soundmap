'use client';
import dynamic from 'next/dynamic';

const EnhancedGraph = dynamic(
  () => import('@/app/components/graph/BubbleVisualization'),
  { ssr: false }
);

export default function ReleasesPage() {
  return <EnhancedGraph />;
}