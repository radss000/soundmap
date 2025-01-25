// lib/services/clustering.ts
import { ElectronicRelease } from '@prisma/client';
import _ from 'lodash';

interface ProcessedNode {
  id: string;
  type: 'release' | 'cluster';
  data: any;
  position: [number, number, number];
}

export function processReleaseData(releases: ElectronicRelease[]) {
  // Grouper par style principal
  const styleGroups = _.groupBy(releases, r => r.styles[0] || 'Unknown');
  
  // Créer les clusters
  const clusters = Object.entries(styleGroups).map(([style, items]) => ({
    id: `cluster-${style}`,
    type: 'cluster',
    data: {
      name: style,
      count: items.length,
      style
    }
  }));

  // Traiter les releases individuelles
  const nodes = releases.map(release => ({
    id: release.id,
    type: 'release',
    data: {
      title: release.title,
      artists: release.artistNames,
      label: release.labelName,
      style: release.styles[0]
    }
  }));

  // Créer les liens
  const links = [];
  releases.forEach(release => {
    if (release.styles[0]) {
      links.push({
        source: release.id,
        target: `cluster-${release.styles[0]}`,
        type: 'style'
      });
    }
  });

  return {
    nodes: [...clusters, ...nodes],
    links
  };
}