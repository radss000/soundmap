import { ElectronicRelease } from '@prisma/client';
import _ from 'lodash';

interface Cluster {
  id: string;
  name: string;
  type: 'cluster';
  size: number;
  style: string;
}

export function clusterReleases(releases: Partial<ElectronicRelease>[]) {
  // Group by primary style
  const styleGroups = _.groupBy(releases, release => release.styles?.[0] || 'Unknown');
  
  const clusters: Cluster[] = Object.entries(styleGroups).map(([style, releases]) => ({
    id: style,
    name: style,
    type: 'cluster',
    size: releases.length,
    style
  }));

  // Create links between related styles
  const links = [];
  releases.forEach(release => {
    if (release.styles && release.styles.length > 1) {
      for (let i = 0; i < release.styles.length - 1; i++) {
        links.push({
          source: release.styles[i],
          target: release.styles[i + 1],
          value: 1
        });
      }
    }
  });

  return { clusters, links };
}