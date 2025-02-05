/* eslint-disable no-restricted-globals */

type GraphNode = {
  id: string;
  name: string;
  type: 'release' | 'artist' | 'label' | 'cluster' | 'track';
  data?: any;
  position?: [number, number, number];
  size?: number;
};

class GraphProcessor {
  private nodes = new Map<string, GraphNode>();
  private links = new Map<string, any>();
  private clusters = new Map<string, GraphNode[]>();
  private visibleNodes = new Set<string>();
  private expandedClusters = new Set<string>();

  processInitialData(releases: any[]) {
    console.log('Processing initial data with releases:', releases.length);
    
    // Créer les nœuds de base (releases, artists, labels)
    releases.forEach(release => {
      // Créer le nœud release
      const releaseNode = this.createReleaseNode(release);
      this.nodes.set(releaseNode.id, releaseNode);

      // Créer les nœuds artists et leurs liens
      if (release.artistNames) {
        release.artistNames.forEach((artistName: string) => {
          const artistId = `artist-${artistName}`;
          if (!this.nodes.has(artistId)) {
            const artistNode = {
              id: artistId,
              name: artistName,
              type: 'artist' as const,
              position: this.randomPosition()
            };
            this.nodes.set(artistId, artistNode);
          }
          
          this.links.set(`${releaseNode.id}-${artistId}`, {
            source: releaseNode.id,
            target: artistId,
            type: 'release-artist'
          });
        });
      }

      // Créer le nœud label et ses liens
      if (release.labelName) {
        const labelId = `label-${release.labelName}`;
        if (!this.nodes.has(labelId)) {
          const labelNode = {
            id: labelId,
            name: release.labelName,
            type: 'label' as const,
            position: this.randomPosition()
          };
          this.nodes.set(labelId, labelNode);
        }
        
        this.links.set(`${releaseNode.id}-${labelId}`, {
          source: releaseNode.id,
          target: labelId,
          type: 'release-label'
        });
      }
    });

    // Créer les clusters basés sur les similarités
    this.createSimilarityClusters();

    // Initialiser avec seulement les clusters visibles
    this.visibleNodes.clear();
    this.clusters.forEach((_, id) => this.visibleNodes.add(id));

    return this.getVisibleGraph();
  }

  handleNodeClick(nodeId: string) {
    console.log('Handling node click:', nodeId);
    
    if (this.clusters.has(nodeId)) {
      if (this.expandedClusters.has(nodeId)) {
        // Si le cluster est déjà développé, on le replie
        this.expandedClusters.delete(nodeId);
        this.visibleNodes.clear();
        this.clusters.forEach((_, id) => this.visibleNodes.add(id));
      } else {
        // Développer le cluster
        const clusterNodes = this.clusters.get(nodeId) || [];
        console.log(`Expanding cluster ${nodeId} with ${clusterNodes.length} nodes`);
        
        // Ajouter tous les nœuds du cluster
        this.expandedClusters.add(nodeId);
        clusterNodes.forEach(node => {
          this.visibleNodes.add(node.id);
          
          // Ajouter les artistes liés
          const artistLinks = Array.from(this.links.entries())
            .filter(([_, link]) => 
              link.type === 'release-artist' && 
              (link.source === node.id || link.target === node.id)
            );
          
          artistLinks.forEach(([_, link]) => {
            const artistId = link.source === node.id ? link.target : link.source;
            this.visibleNodes.add(artistId);
          });

          // Ajouter les labels liés
          const labelLinks = Array.from(this.links.entries())
            .filter(([_, link]) => 
              link.type === 'release-label' && 
              (link.source === node.id || link.target === node.id)
            );
          
          labelLinks.forEach(([_, link]) => {
            const labelId = link.source === node.id ? link.target : link.source;
            this.visibleNodes.add(labelId);
          });
        });
      }
    }

    // Retourner le graphe mis à jour
    console.log('Visible nodes:', this.visibleNodes.size);
    return this.getVisibleGraph();
  }

  private createSimilarityClusters() {
    const releases = Array.from(this.nodes.values())
      .filter(node => node.type === 'release');

    let currentClusterId = 0;
    const unassignedNodes = new Set(releases.map(r => r.id));

    while (unassignedNodes.size > 0) {
      const seedId = Array.from(unassignedNodes)[0];
      const seed = this.nodes.get(seedId)!;
      
      // Trouver les nœuds similaires
      const similarNodes = releases
        .filter(node => 
          unassignedNodes.has(node.id) &&
          this.calculateSimilarity(seed, node) > 0.3
        );

      if (similarNodes.length >= 3) {
        const clusterId = `cluster-${currentClusterId++}`;
        const mainLabel = this.getMostCommonValue(similarNodes, 'labelName');
        
        const clusterNode = {
          id: clusterId,
          name: `${mainLabel || 'Cluster'} Group`,
          type: 'cluster' as const,
          data: {
            count: similarNodes.length,
            mainLabel: mainLabel,
            releases: similarNodes
          },
          position: this.calculateCenter(similarNodes)
        };

        this.nodes.set(clusterId, clusterNode);
        this.clusters.set(clusterId, similarNodes);
        
        // Créer les liens cluster -> releases
        similarNodes.forEach(node => {
          unassignedNodes.delete(node.id);
          this.links.set(`${clusterId}-${node.id}`, {
            source: clusterId,
            target: node.id,
            type: 'cluster-release'
          });
        });
      } else {
        unassignedNodes.delete(seedId);
      }
    }
  }

  private calculateSimilarity(node1: GraphNode, node2: GraphNode): number {
    let similarity = 0;

    // Vérifier le label (fort poids)
    if (node1.data?.labelName && node2.data?.labelName) {
      if (node1.data.labelName === node2.data.labelName) {
        similarity += 0.4;
      }
    }

    // Vérifier les artistes communs
    if (node1.data?.artistNames && node2.data?.artistNames) {
      const commonArtists = node1.data.artistNames.filter((artist: string) =>
        node2.data.artistNames.includes(artist)
      );
      similarity += (commonArtists.length / Math.max(
        node1.data.artistNames.length,
        node2.data.artistNames.length
      )) * 0.4;
    }

    // Vérifier les styles (faible poids)
    if (node1.data?.styles && node2.data?.styles) {
      const commonStyles = node1.data.styles.filter((style: string) =>
        node2.data.styles.includes(style)
      );
      similarity += (commonStyles.length / Math.max(
        node1.data.styles.length,
        node2.data.styles.length
      )) * 0.2;
    }

    return similarity;
  }

  private getVisibleGraph() {
    const nodes = Array.from(this.visibleNodes)
      .map(id => this.nodes.get(id))
      .filter(Boolean) as GraphNode[];

    const links = Array.from(this.links.values())
      .filter(link => 
        this.visibleNodes.has(link.source) && 
        this.visibleNodes.has(link.target)
      );

    console.log('Returning graph with nodes:', nodes.length, 'links:', links.length);
    return { nodes, links };
  }

  // Helper methods...
  private createReleaseNode(data: any): GraphNode {
    return {
      id: data.id,
      name: data.title,
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

  private getMostCommonValue(nodes: GraphNode[], key: 'labelName' | 'styles'): string {
    const counts = new Map<string, number>();
    
    nodes.forEach(node => {
      const value = node.data?.[key];
      if (Array.isArray(value)) {
        value.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
      } else if (value) {
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    });

    let maxCount = 0;
    let mostCommon = '';
    counts.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = value;
      }
    });

    return mostCommon;
  }
}

const processor = new GraphProcessor();

self.onmessage = (event: MessageEvent) => {
  try {
    const { type, data } = event.data;
    console.log('Worker received message:', type);

    switch (type) {
      case 'INIT': {
        console.log('Initializing with releases:', data?.length);
        const processed = processor.processInitialData(data);
        self.postMessage({ 
          type: 'NODES_PROCESSED', 
          data: processed 
        });
        break;
      }
      case 'NODE_CLICKED': {
        console.log('Processing node click:', data?.nodeId);
        const updated = processor.handleNodeClick(data.nodeId);
        if (updated) {
          self.postMessage({ 
            type: 'NODES_UPDATED', 
            data: updated 
          });
        }
        break;
      }
      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({ 
      type: 'ERROR', 
      data: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export {};