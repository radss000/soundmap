export type GraphNode = {
    id: string;
    name: string;
    type: string;
    data?: any;
    position?: [number, number, number];
    size?: number;
  };
  
  export class ClusterManager {
    private clusters: Map<string, GraphNode[]>;
  
    constructor() {
      this.clusters = new Map();
    }
  
    createCluster(style: string, nodes: GraphNode[]): GraphNode {
      const avgPosition = this.calculateCenter(nodes);
      return {
        id: `cluster-${style}`,
        name: `${style} Cluster`,
        type: 'cluster',
        data: {
          count: nodes.length,
          styles: [style],
          releases: nodes
        },
        position: avgPosition,
        size: Math.sqrt(nodes.length) * 2
      };
    }
  
    private calculateCenter(nodes: GraphNode[]): [number, number, number] {
      const sum = nodes.reduce(
        (acc, node) => {
          const pos = node.position || [0, 0, 0];
          return [acc[0] + pos[0], acc[1] + pos[1], acc[2] + pos[2]];
        },
        [0, 0, 0]
      );
      return [
        sum[0] / nodes.length,
        sum[1] / nodes.length,
        sum[2] / nodes.length
      ];
    }
  }