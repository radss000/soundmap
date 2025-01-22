'use client';

import dynamic from 'next/dynamic';

const BubbleVisualization = dynamic(
  () => import('@/app/components/graph/BubbleVisualization'),
  { ssr: false }
);

export default function TestPage() {
  return (
    <div className="w-full h-screen">
      <BubbleVisualization />
    </div>
  );
}