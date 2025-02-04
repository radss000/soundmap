import * as THREE from 'three';

export type GraphNode = {
  id: string;
  name: string;
  type: 'release' | 'artist' | 'label' | 'cluster';
  data?: {
    artistNames?: string[];
    labelName?: string;
    styles?: string[];
    year?: number;
    count?: number;
    releases?: GraphNode[];
  };
  position?: [number, number, number];
  size?: number;
  val?: number;
  color?: string;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  __threeObj?: THREE.Object3D;
};

export type GraphLink = {
  source: string;
  target: string;
  type: string;
  value?: number;
  color?: string;
};

export type Viewport = {
  position: { x: number; y: number; z: number };
  target?: { x: number; y: number; z: number };
  radius: number;
};

export type LODLevel = {
  nodeDetail: 'high' | 'medium' | 'low';
  showLabels: boolean;
  particleCount: number;
  resolution: number;
};

export type ClusterConfig = {
  radius: number;
  minNodes: number;
  maxNodes: number;
  styles?: string[];
  forceStrength?: number;
};

export type RenderConfig = {
  antialias: boolean;
  pixelRatio?: number;
  alpha: boolean;
  powerPreference: 'high-performance' | 'low-power';
};

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

export type CameraConfig = {
  fov: number;
  near: number;
  far: number;
  position: [number, number, number];
};

export type WorkerMessage = {
  type: 'INIT' | 'FILTER' | 'UPDATE_VISIBLE' | 'NODE_CLICKED' | 'CLUSTER_UPDATE' | 'ERROR';
  data: any;
};

export type WorkerResponse = {
  type: 'NODES_PROCESSED' | 'NODES_UPDATED' | 'ERROR';
  data: GraphData | string;
};

export type GraphControls = {
  zoomLevel: number;
  rotationSpeed: number;
  dragEnabled: boolean;
  cameraDistance: number;
};

export interface NodeClickEvent {
  node: GraphNode;
  event: MouseEvent;
  camera: THREE.Camera;
  pointer: { x: number; y: number };
}

export type ForceGraphProps = {
  data: GraphData;
  controls?: Partial<GraphControls>;
  renderConfig?: Partial<RenderConfig>;
  cameraConfig?: Partial<CameraConfig>;
  nodeColors?: Record<string, string>;
  onNodeClick?: (event: NodeClickEvent) => void;
  onCameraMove?: (viewport: Viewport) => void;
  onRender?: () => void;
};

export interface ViewportManager {
  updateViewport: (camera: THREE.Camera) => Viewport;
  isNodeVisible: (node: GraphNode, viewport: Viewport) => boolean;
  getVisibleNodes: (nodes: GraphNode[], viewport: Viewport) => GraphNode[];
}

export interface NodeStyleConfig {
  baseSize: number;
  clusterScale: number;
  colorMap: Record<string, string>;
  glowIntensity: number;
  opacity: Record<'normal' | 'highlighted' | 'faded', number>;
}

export type ThreeObjectGenerator = {
  createNodeObject: (node: GraphNode, lod: LODLevel) => THREE.Object3D;
  createLinkObject: (link: GraphLink) => THREE.Line;
  createParticles: (link: GraphLink, count: number) => THREE.Points;
};