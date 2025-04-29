// lib/services/ViewportManager.ts

import { GraphNode, Viewport } from '../types/graph';
import * as d3 from 'd3';

export class ViewportManager {
  private quadtree: d3.Quadtree<GraphNode>;
  private viewport: Viewport;

  constructor() {
    this.quadtree = d3.quadtree<GraphNode>();
    this.viewport = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      scale: 1
    };
  }

  updateViewport(transform: d3.ZoomTransform) {
    this.viewport = {
      x: transform.x,
      y: transform.y,
      width: window.innerWidth / transform.k,
      height: window.innerHeight / transform.k,
      scale: transform.k
    };
  }

  updateNodePositions(nodes: GraphNode[]) {
    this.quadtree = d3.quadtree<GraphNode>()
      .x(d => d.x || 0)
      .y(d => d.y || 0)
      .addAll(nodes);
  }

  getVisibleNodes(): GraphNode[] {
    const visible: GraphNode[] = [];
    const margin = 100; // Buffer zone for smooth transitions

    this.quadtree.visit((node, x1, y1, x2, y2) => {
      if (!node.length) {
        const d = node.data;
        if (d && this.isNodeVisible(d)) {
          visible.push(d);
        }
        return false;
      }
      return x1 > (this.viewport.x + this.viewport.width + margin) ||
             x2 < (this.viewport.x - margin) ||
             y1 > (this.viewport.y + this.viewport.height + margin) ||
             y2 < (this.viewport.y - margin);
    });

    return visible;
  }

  private isNodeVisible(node: GraphNode): boolean {
    if (!node.x || !node.y) return false;
    
    const nodeSize = node.type === 'cluster' ? 
      node.radius * (node.data?.count || 1) : 
      node.radius;

    return node.x + nodeSize >= this.viewport.x - nodeSize &&
           node.x - nodeSize <= this.viewport.x + this.viewport.width + nodeSize &&
           node.y + nodeSize >= this.viewport.y - nodeSize &&
           node.y - nodeSize <= this.viewport.y + this.viewport.height + nodeSize;
  }

  findNeighbors(node: GraphNode, radius: number): GraphNode[] {
    const neighbors: GraphNode[] = [];
    this.quadtree.visit((quad, x1, y1, x2, y2) => {
      if (!quad.length) {
        const d = quad.data;
        if (d && d !== node && this.distance(node, d) < radius) {
          neighbors.push(d);
        }
        return false;
      }
      const closest = this.closestPoint(node.x!, node.y!, x1, y1, x2, y2);
      return closest > radius;
    });
    return neighbors;
  }

  private distance(a: GraphNode, b: GraphNode): number {
    return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
  }

  private closestPoint(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = Math.max(x1 - px, 0, px - x2);
    const dy = Math.max(y1 - py, 0, py - y2);
    return Math.sqrt(dx * dx + dy * dy);
  }
}