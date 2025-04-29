// lib/services/InteractionManager.ts

import * as d3 from 'd3';
import { GraphNode, GraphLink, InteractionConfig } from '../types/graph';
import { ViewportManager } from './ViewportManager';

export class InteractionManager {
  private canvas: HTMLCanvasElement;
  private simulation: d3.Simulation<GraphNode, GraphLink>;
  private config: InteractionConfig;
  private viewportManager: ViewportManager;
  private transform: d3.ZoomTransform;
  private selectedNode: GraphNode | null;
  private draggedNode: GraphNode | null;
  private expandedClusters: Set<string>;

  constructor(
    canvas: HTMLCanvasElement, 
    simulation: d3.Simulation<GraphNode, GraphLink>,
    viewportManager: ViewportManager,
    config: InteractionConfig
  ) {
    this.canvas = canvas;
    this.simulation = simulation;
    this.config = config;
    this.viewportManager = viewportManager;
    this.transform = d3.zoomIdentity;
    this.selectedNode = null;
    this.draggedNode = null;
    this.expandedClusters = new Set();

    this.setupZoom();
    this.setupDrag();
    this.setupClick();
  }

  private setupZoom() {
    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent(this.config.zoomRange)
      .on('zoom', (event) => {
        this.transform = event.transform;
        this.viewportManager.updateViewport(this.transform);
      });

    d3.select(this.canvas).call(zoom);
  }

  private setupDrag() {
    if (!this.config.dragEnabled) return;

    const drag = d3.drag<HTMLCanvasElement, unknown>()
      .subject((event) => {
        const [x, y] = this.getLocalCoordinates(event);
        return this.findNodeAtPosition(x, y);
      })
      .on('start', (event) => {
        if (!event.subject) return;
        this.draggedNode = event.subject as GraphNode;
        if (!this.draggedNode) return;
        
        this.simulation.alphaTarget(0.3).restart();
        this.draggedNode.fx = this.draggedNode.x;
        this.draggedNode.fy = this.draggedNode.y;
      })
      .on('drag', (event) => {
        if (!this.draggedNode) return;
        const [x, y] = this.getLocalCoordinates(event);
        this.draggedNode.fx = x;
        this.draggedNode.fy = y;
      })
      .on('end', () => {
        if (!this.draggedNode) return;
        this.simulation.alphaTarget(0);
        this.draggedNode.fx = null;
        this.draggedNode.fy = null;
        this.draggedNode = null;
      });

    d3.select(this.canvas).call(drag);
  }

  private setupClick() {
    d3.select(this.canvas).on('click', (event) => {
      const [x, y] = this.getLocalCoordinates(event);
      const node = this