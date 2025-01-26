// lib/services/graphTransformer.ts
import { GraphNode, GraphLink } from '../types/graph';

const NODE_COLORS = {
  artist: '#FF4081',
  label: '#00BCD4',
  release: '#4CAF50'
};

export function processReleases(releases: any[]) {
  const nodes = new Map<string, GraphNode>();
  const links = new Map<string, GraphLink>();
  const artistsMap = new Map();
  const labelsMap = new Map();

  releases.forEach(release => {
    // Add release node
    nodes.set(release.id, {
      id: release.id,
      name: release.title,
      type: 'release',
      color: NODE_COLORS.release,
      data: release
    });

    // Process artists
    release.artistNames.forEach(artistName => {
      const artistId = `artist-${artistName}`;
      if (!artistsMap.has(artistId)) {
        artistsMap.set(artistId, {
          id: artistId,
          name: artistName,
          type: 'artist',
          color: NODE_COLORS.artist,
          releaseCount: 1
        });
      } else {
        artistsMap.get(artistId).releaseCount++;
      }

      const linkId = `${release.id}-${artistId}`;
      links.set(linkId, {
        source: release.id,
        target: artistId,
        type: 'artist_release'
      });
    });

    // Process label
    if (release.labelName) {
      const labelId = `label-${release.labelName}`;
      if (!labelsMap.has(labelId)) {
        labelsMap.set(labelId, {
          id: labelId,
          name: release.labelName,
          type: 'label',
          color: NODE_COLORS.label,
          releaseCount: 1
        });
      } else {
        labelsMap.get(labelId).releaseCount++;
      }

      links.set(`${release.id}-${labelId}`, {
        source: release.id,
        target: labelId,
        type: 'label_release'
      });
    }
  });

  return {
    nodes: [...nodes.values(), ...artistsMap.values(), ...labelsMap.values()],
    links: [...links.values()]
  };
}