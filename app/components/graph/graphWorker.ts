/* eslint-disable no-restricted-globals */
// Necessary for worker context

type Node = {
  id: string;
  name: string;
  type: string;
  data?: any;
  position?: [number, number, number];
};

type Link = {
  source: string;
  target: string;
  type: string;
};

class GraphProcessor {
  private nodes = new Map<string, Node>();
  private links = new Map<string, Link>();
  private clusters = new Map<string, Node[]>();
  private visibleNodes = new Set<string>();

  private createNode(data: any): Node {
    return {
      id: data.id,
      name: data.title || data.name,
      type: 'release',
      data: {
        artistNames: data.artistNames,
        labelName: data.labelName,
        styles: data.styles,
        year: data.year
      },
      position: this.randomPosition()
    };
  }

  private randomPosition(): [number, number, number] {
    return [
      (Math.random() - 0.5) * 1000,
      (Math.random() - 0.5) * 1000,
      (Math.random() - 0.5) * 1000
    ];
  }

  private createCluster(nodes: Node[], id: string): Node {
    const centerPos = this.calculateClusterCenter(nodes);
    return {
      id: `cluster-${id}`,
      name: `${id} Cluster`,
      type: 'cluster',
      data: {
        nodes,
        count: nodes.length,
        styles: [...new Set(nodes.flatMap(n => n.data?.styles || []))]
      },
      position: centerPos
    };
  }

  private calculateClusterCenter(nodes: Node[]): [number, number, number] {
    if (!nodes.length) return [0, 0, 0];
    const sum = nodes.reduce((acc, node) => {
      const pos = node.position || [0, 0, 0];
      return [acc[0] + pos[0], acc[1] + pos[1], acc[2] + pos[2]];
    }, [0, 0, 0]);
    return [
      sum[0] / nodes.length,
      sum[1] / nodes.length,
      sum[2] / nodes.length
    ];
  }

  processInitialData(releases: any[]) {
    this.nodes.clear();
    this.links.clear();
    this.clusters.clear();
    this.visibleNodes.clear();

    const BATCH_SIZE = 1000;
    for (let i = 0; i < releases.length; i += BATCH_SIZE) {
      const batch = releases.slice(i, i + BATCH_SIZE);
      this.processBatch(batch);
    }

    return this.getVisibleGraph();
  }

  private processBatch(releases: any[]) {
    const CLUSTER_SIZE = 20;
    
    releases.forEach(release => {
      const node = this.createNode(release);
      this.nodes.set(node.id, node);
      
      if (release.styles?.[0]) {
        const style = release.styles[0];
        if (!this.clusters.has(style)) {
          this.clusters.set(style, []);
        }
        this.clusters.get(style)?.push(node);
      }
    });

    this.clusters.forEach((nodes, style) => {
      if (nodes.length >= CLUSTER_SIZE) {
        const cluster = this.createCluster(nodes, style);
        this.nodes.set(cluster.id, cluster);
        
        nodes.forEach(node => {
          const linkId = `${cluster.id}-${node.id}`;
          this.links.set(linkId, {
            source: cluster.id,
            target: node.id,
            type: 'cluster'
          });
        });
      }
    });
  }

  updateVisibleNodes(center: { x: number; y: number; z: number }, radius: number) {
    this.visibleNodes.clear();
    
    this.nodes.forEach((node, id) => {
      if (!node.position) return;
      
      const dx = node.position[0] - center.x;
      const dy = node.position[1] - center.y;
      const dz = node.position[2] - center.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance <= radius) {
        this.visibleNodes.add(id);
      }
    });

    return this.getVisibleGraph();
  }

  private getVisibleGraph() {
    const nodes = Array.from(this.visibleNodes)
      .map(id => this.nodes.get(id))
      .filter(Boolean);

    const links = Array.from(this.links.values())
      .filter(link => 
        this.visibleNodes.has(link.source) && 
        this.visibleNodes.has(link.target)
      );

    return { nodes, links };
  }
}

const processor = new GraphProcessor();

// Explicitly type the context for the worker
const ctx: Worker = self as any;

ctx.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'INIT':
        const processed = processor.processInitialData(data);
        ctx.postMessage({ type: 'NODES_PROCESSED', data: processed });
        break;

      case 'UPDATE_VISIBLE':
        const visible = processor.updateVisibleNodes(data.center, data.radius);
        ctx.postMessage({ type: 'NODES_UPDATED', data: visible });
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    ctx.postMessage({ 
      type: 'ERROR',
      data: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export type {} // Nécessaire pour que TypeScript traite ce fichier comme un module