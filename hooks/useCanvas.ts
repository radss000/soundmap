// hooks/useCanvas.ts
import { useCallback } from 'react';
import * as d3 from 'd3';
import { type Cluster, type Release } from '@/lib/types';

interface UseCanvasOptions {
  onNodeClick: (node: Release | Cluster | null) => void;
  onTransform: (transform: { x: number; y: number; scale: number }) => void;
}

export function useCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: UseCanvasOptions
) {
  const initCanvas = useCallback((clusters: Cluster[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Set up canvas for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Set up D3 force simulation
    const simulation = d3.forceSimulation(clusters as any)
      .force('charge', d3.forceManyBody().strength(-100))
      .force('collide', d3.forceCollide().radius(d => (d as Cluster).radius))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Set up zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        options.onTransform({
          x: event.transform.x,
          y: event.transform.y,
          scale: event.transform.k
        });
      });

    d3.select(canvas).call(zoom as any);

    // Handle click events
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Find clicked node
      const node = clusters.find(cluster => {
        const dx = cluster.x! - x;
        const dy = cluster.y! - y;
        return Math.sqrt(dx * dx + dy * dy) < cluster.radius;
      });

      options.onNodeClick(node || null);
    });

    return { ctx, simulation };
  }, [options]);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render nodes
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    
    // Your rendering logic here - refer to previous D3 setup
    // This will include drawing circles, labels, etc.

  }, []);

  return { initCanvas, renderFrame };
}