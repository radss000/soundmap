'use client';
import dynamic from 'next/dynamic';

const HierarchicalGraph = dynamic(
  () => import('@/app/components/graph/HierarchicalGraph'),
  { ssr: false }
);

export default function GraphPage() {
  return <HierarchicalGraph />;
}