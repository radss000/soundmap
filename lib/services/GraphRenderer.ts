// lib/services/GraphRenderer.ts

import { GraphNode, GraphLink, RenderConfig, Viewport } from '../types/graph';

export class GraphRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: RenderConfig;
  private devicePixelRatio: number;

  constructor(canvas: HTMLCanvasElement, config: RenderConfig) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    this.config = config;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.setupCanvas();
  }

  private setupCanvas() {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
  }

  render(nodes: GraphNode[], links: GraphLink[], viewport: Viewport) {
    this.clear();
    this.ctx.save();
    
    // Apply viewport transform
    this.ctx.translate(viewport.x, viewport.y);
    this.ctx.scale(viewport.scale, viewport.scale);

    // Render links first
    this.renderLinks(links);

    // Render nodes
    this.renderNodes(nodes);

    // Render labels if zoom level is sufficient
    if (viewport.scale > this.config.labelThreshold) {
      this.renderLabels(nodes, viewport.scale);
    }

    this.ctx.restore();
  }

  private clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderNodes(nodes: GraphNode[]) {
    nodes.forEach(node => {
      if (!node.x || !node.y) return;

      this.ctx.beginPath();
      const radius = this.getNodeRadius(node);
      this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = node.color;
      this.ctx.fill();

      if (node.type === 'cluster') {
        // Add glow effect for clusters
        this.ctx.shadowColor = node.color;
        this.ctx.shadowBlur = radius * 0.5;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    });
  }

  private renderLinks(links: GraphLink[]) {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    this.ctx.lineWidth = 1;

    links.forEach(link => {
      const source = link.source as GraphNode;
      const target = link.target as GraphNode;
      
      if (!source.x || !source.y || !target.x || !target.y) return;

      this.ctx.beginPath();
      this.ctx.moveTo(source.x, source.y);
      this.ctx.lineTo(target.x, target.y);
      this.ctx.stroke();
    });
  }

  private renderLabels(nodes: GraphNode[], scale: number) {
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#ffffff';

    nodes.forEach(node => {
      if (!node.x || !node.y) return;

      const radius = this.getNodeRadius(node);
      const labelY = node.y + radius + 15;

      if (node.type === 'cluster') {
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`${node.name} (${node.data?.count || 0})`, node.x, labelY);
      } else {
        this.ctx.font = '12px Arial';
        this.ctx.fillText(node.name, node.x, labelY);
      }
    });
  }

  private getNodeRadius(node: GraphNode): number {
    if (node.type === 'cluster') {
      return this.config.nodeRadius + 
        Math.sqrt(node.data?.count || 1) * this.config.clusterNodeScale;
    }
    return node.radius;
  }

  resize() {
    this.setupCanvas();
  }
}