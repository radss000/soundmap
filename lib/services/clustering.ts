// lib/services/clustering.ts
import { ElectronicRelease } from '@prisma/client';
import _ from 'lodash';

export interface ClusterNode {
  id: string;
  name: string;
  type: 'cluster';
  size: number;
  color?: string;
  childCount: number;
  data: {
    style: string;
    count: number;
  };
}

export interface ReleaseNode {
  id: string;
  name: string;
  type: 'release';
  size: number;
  color?: string;
  data: Partial<ElectronicRelease>;
}

export interface Link {
  source: string;
  target: string;
  value: number;
  type?: string;
}

export function clusterReleases(releases: Partial<ElectronicRelease>[]) {
  console.log(`Clustering ${releases.length} releases...`);
  
  // Group releases by primary style
  const styleGroups = _.groupBy(releases, r => r.styles?.[0] || 'Unknown');
  
  // Create cluster nodes
  const clusters: ClusterNode[] = Object.entries(styleGroups).map(([style, items]) => ({
    id: `cluster-${style}`,
    name: style,
    type: 'cluster',
    size: Math.sqrt(items.length) * 2,
    childCount: items.length,
    data: {
      style,
      count: items.length
    }
  }));

  // Create links between clusters and releases
  const links: Link[] = [];
  
  // Link releases to their style clusters
  releases.forEach(release => {
    const style = release.styles?.[0];
    if (style) {
      links.push({
        source: release.id,
        target: `cluster-${style}`,
        value: 1,
        type: 'style'
      });
    }
  });
  
  // Link releases with the same label
  const labelGroups = _.groupBy(releases, r => r.labelName);
  Object.values(labelGroups).forEach(group => {
    if (group.length > 1) {
      for (let i = 0; i < group.length - 1; i++) {
        links.push({
          source: group[i].id,
          target: group[i + 1].id,
          value: 0.5,
          type: 'label'
        });
      }
    }
  });
  
  console.log(`Created ${clusters.length} clusters and ${links.length} links`);
  
  return { clusters, links };
}