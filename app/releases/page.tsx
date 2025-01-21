// app/releases/page.tsx
'use client';

import dynamic from 'next/dynamic';

const BubbleVisualization = dynamic(
  () => import('@/components/graph/BubbleVisualization'),
  { ssr: false }
);

export default function ReleasesPage() {
  return <BubbleVisualization />;
}