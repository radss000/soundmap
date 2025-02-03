export interface GraphNode {
  id: string;
  name: string;
  type: 'artist' | 'label' | 'release' | 'cluster';
  color: string;
  size?: number;
  data?: {
    artistNames?: string[];
    labelName?: string;
    styles?: string[];
    year?: number;
    nodes?: GraphNode[];
    count?: number;
  };
  position?: [number, number, number];
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'collaboration' | 'release' | 'cluster';
  value?: number;
}

export interface GraphState {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNode: GraphNode | null;
  setNodes: (nodes: GraphNode[]) => void;
  setLinks: (links: GraphLink[]) => void;
  setSelectedNode: (node: GraphNode | null) => void;
}