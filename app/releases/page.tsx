import dynamic from 'next/dynamic';

const GraphVisualization = dynamic(
  () => import('../../components/graph/GraphVisualization'),
  { ssr: false }
);

export default function ExplorePage() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <GraphVisualization />
    </div>
  );
}