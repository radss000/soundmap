// lib/services/graphTransformer.ts
import { GraphNode, GraphLink } from '../types/graph';
import { DiscogsArtist, DiscogsRelease } from '../types/discogs';

export class GraphTransformer {
  static artistToNode(artist: DiscogsArtist): GraphNode {
    return {
      id: artist.id.toString(),
      name: artist.name,
      type: 'artist',
      color: 'rgb(255, 64, 129)',
      size: 20,
      imageUrl: artist.images?.[0]?.uri150,
    };
  }

  static releaseToNode(release: DiscogsRelease): GraphNode {
    return {
      id: release.id.toString(),
      name: release.title,
      type: 'release',
      color: 'rgb(76, 175, 80)',
      size: 15,
      imageUrl: release.thumb,
    };
  }

  static createArtistReleaseLink(artistId: string, releaseId: string): GraphLink {
    return {
      source: artistId,
      target: releaseId,
      type: 'release',
    };
  }
}