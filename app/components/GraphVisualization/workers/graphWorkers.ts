// graphWorker.ts
import _ from 'lodash';

const CLUSTER_THRESHOLD = 0.5;
const MAX_NODES_PER_LEVEL = 100;

interface Release {
  id: string;
  title: string;
  artistNames: string[];
  labelName: string;
  styles: string[];
  year: number;
}

function calculateSimilarity(release1: Release, release2: Release) {
  const styleMatch = _.intersection(release1.styles, release2.styles).length / 
                    _.union(release1.styles, release2.styles).length;
  const labelMatch = release1.labelName === release2.labelName ? 1 : 0;
  return (styleMatch * 0.7) + (labelMatch * 0.3);
}

function createClusters(releases: Release[]) {
  // Group by primary style
  const styleGroups = _.groupBy(releases, r => r.styles[0] || 'Unknown');
  
  // Create cluster nodes
  const clusters = Object.entries(styleGroups).map(([style, items]) => ({
    id: `cluster-${style}`,
    name: style,
    type: 'cluster',
    size: Math.sqrt(items.length) * 3,
    color: '#9333ea',
    childCount: items.length
  }));

  // Create release nodes
  const nodes = releases.map(release => ({
    id: release.id,
    name: release.title,
    type: 'release',
    size: 5,
    color: '#2563eb',
    data: release
  }));

  // Create links
  const links = [];
  
  // Links between releases and their style clusters
  releases.forEach(release => {
    if (release.styles[0]) {
      links.push({
        source: release.id,
        target: `cluster-${release.styles[0]}`,
        value: 1
      });
    }
  });

  // Links between similar releases
  for (let i = 0; i < releases.length; i++) {
    for (let j = i + 1; j < releases.length; j++) {
      const similarity = calculateSimilarity(releases[i], releases[j]);
      if (similarity > CLUSTER_THRESHOLD) {
        links.push({
          source: releases[i].id,
          target: releases[j].id,
          value: similarity
        });
      }
    }
  }

  return {
    nodes: [...clusters, ...nodes.slice(0, MAX_NODES_PER_LEVEL)],
    links
  };
}

self.onmessage = (event) => {
  const { type, data } = event.data;
  
  if (type === 'PROCESS_DATA') {
    const clusteredData = createClusters(data);
    self.postMessage({ type: 'CLUSTERED_DATA', data: clusteredData });
  }
};

export {};