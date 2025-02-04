/* eslint-disable no-restricted-globals */

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

type FilterData = {
  searchTerm: string;
  selectedStyles: string[];
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

  processInitialData(releases: any[]) {
    if (!releases || !Array.isArray(releases)) {
      throw new Error('Invalid releases data');
    }

    this.nodes.clear();
    this.links.clear();
    this.clusters.clear();
    this.visibleNodes.clear();

    const BATCH_SIZE = 1000;
    for (let i = 0; i < releases.length; i += BATCH_SIZE) {
      const batch = releases.slice(i, i + BATCH_SIZE);
      this.processBatch(batch);
    }

    this.nodes.forEach((_, id) => this.visibleNodes.add(id));
    return this.getVisibleGraph();
  }

  private processBatch(releases: any[]) {
    releases.forEach(release => {
      if (!release.id) return;
      
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
  }

  filterNodes(filterData: FilterData) {
    const { searchTerm = '', selectedStyles = [] } = filterData;
    this.visibleNodes.clear();
    
    this.nodes.forEach((node, id) => {
      let visible = true;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        visible = node.name.toLowerCase().includes(searchLower) ||
                 node.data?.artistNames?.some(name => 
                   name.toLowerCase().includes(searchLower)
                 ) ||
                 node.data?.labelName?.toLowerCase().includes(searchLower);
      }

      if (visible && selectedStyles.length > 0) {
        visible = node.data?.styles?.some(style => 
          selectedStyles.includes(style)
        ) || false;
      }

      if (visible) {
        this.visibleNodes.add(id);
      }
    });

    return this.getVisibleGraph();
  }

  updateVisibleNodes(position: { x: number; y: number; z: number }, radius: number) {
    this.visibleNodes.clear();
    
    this.nodes.forEach((node, id) => {
      if (!node.position) return;
      
      const dx = node.position[0] - position.x;
      const dy = node.position[1] - position.y;
      const dz = node.position[2] - position.z;
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

const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent) => {
  try {
    const { type, data } = event.data;
    
    switch (type) {
      case 'INIT': {
        const processed = processor.processInitialData(data);
        ctx.postMessage({ type: 'NODES_PROCESSED', data: processed });
        break;
      }

      case 'FILTER': {
        if (!data) {
          throw new Error('Filter data is undefined');
        }
        const filterData = {
          searchTerm: data.searchTerm || '',
          selectedStyles: Array.isArray(data.selectedStyles) ? data.selectedStyles : []
        };
        const filtered = processor.filterNodes(filterData);
        ctx.postMessage({ type: 'NODES_UPDATED', data: filtered });
        break;
      }

      case 'UPDATE_VISIBLE': {
        if (!data?.position) {
          throw new Error('Position data is undefined');
        }
        const visible = processor.updateVisibleNodes(data.position, data.radius || 100);
        if (visible) {
          ctx.postMessage({ type: 'NODES_UPDATED', data: visible });
        }
        break;
      }

      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    console.error('Worker error:', error);
    ctx.postMessage({ 
      type: 'ERROR',
      data: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export {};