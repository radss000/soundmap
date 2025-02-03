const BATCH_SIZE = 1000;
const CLUSTER_SIZE = 20;

type Node = {
  id: string;
  type: string;
  position: [number, number, number];
  data: any;
};

class GraphProcessor {
  private nodes: Map<string, Node> = new Map();
  private links: Map<string, any> = new Map();
  private clusters: Map<string, any> = new Map();
  private rawData: any[] = [];

  processInitialData(data: any[]) {
    this.rawData = data;
    const processed = this.createClusters(data);
    
    this.nodes = new Map(processed.nodes.map(n => [n.id, n]));
    this.links = new Map(processed.links.map(l => [`${l.source}-${l.target}`, l]));
    
    return processed;
  }

  private createClusters(items: any[]) {
    const clusters: Node[] = [];
    const nodes: Node[] = [];
    const links: any[] = [];
    
    let clusterIndex = 0;
    let clusterNodes: Node[] = [];

    items.forEach((item, index) => {
      const node = this.createNode(item);
      clusterNodes.push(node);

      if (clusterNodes.length === CLUSTER_SIZE || index === items.length - 1) {
        const cluster = this.createClusterNode(clusterNodes, clusterIndex++);
        clusters.push(cluster);
        nodes.push(...clusterNodes);
        
        clusterNodes.forEach(n => {
          links.push({
            source: cluster.id,
            target: n.id,
            type: 'cluster'
          });
        });
        
        clusterNodes = [];
      }
    });

    return { nodes: [...clusters, ...nodes], links };
  }

  private createNode(item: any): Node {
    return {
      id: item.id,
      type: 'release',
      position: this.randomPosition(),
      data: {
        title: item.title,
        artists: item.artistNames,
        label: item.labelName
      }
    };
  }

  private createClusterNode(nodes: Node[], index: number): Node {
    return {
      id: `cluster-${index}`,
      type: 'cluster',
      position: this.randomPosition(),
      data: {
        nodes,
        count: nodes.length
      }
    };
  }

  private randomPosition(): [number, number, number] {
    return [
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    ];
  }

  updateVisibleNodes(center: any, radius: number) {
    const visibleNodes = Array.from(this.nodes.values()).filter(node => {
      const dx = node.position[0] - center.x;
      const dy = node.position[1] - center.y;
      const dz = node.position[2] - center.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) <= radius;
    });

    const visibleLinks = Array.from(this.links.values()).filter(link => {
      const sourceNode = this.nodes.get(link.source);
      const targetNode = this.nodes.get(link.target);
      return sourceNode && targetNode;
    });

    return { nodes: visibleNodes, links: visibleLinks };
  }
}

const processor = new GraphProcessor();

self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'INIT':
        const processed = processor.processInitialData(data);
        self.postMessage({ type: 'NODES_PROCESSED', data: processed });
        break;

      case 'UPDATE_VISIBLE':
        const visible = processor.updateVisibleNodes(data.position, data.radius);
        self.postMessage({ type: 'NODES_UPDATED', data: visible });
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR',
      data: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};