// /server/context.ts
import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { DiscogsAPI } from '@/lib/services/discogs';

interface GraphNode {
  id: string;
  name: string;
  type: 'artist' | 'label' | 'release';
  color: string;
  size: number;
  imageUrl?: string;
}

interface GraphLink {
  source: string;
  target: string;
  type: 'collaboration' | 'release' | 'label';
  value?: number;
}

async function buildArtistGraph(artistId: string) {
  const discogs = DiscogsAPI.getInstance();
  
  try {
    // Récupérer les données de l'artiste
    const [artist, releases, collaborations] = await Promise.all([
      discogs.getArtist(artistId),
      discogs.getArtistReleases(artistId, { perPage: 50 }),
      discogs.getArtistCollaborations(artistId),
    ]);

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Ajouter l'artiste principal
    nodes.push({
      id: artist.id.toString(),
      name: artist.name,
      type: 'artist',
      color: 'rgb(255, 64, 129)', // Rose pour les artistes
      size: 25, // Plus gros pour l'artiste principal
      imageUrl: artist.images?.[0]?.uri150
    });

    // Ajouter les releases
    releases.results.forEach(release => {
      nodes.push({
        id: `release-${release.id}`,
        name: release.title,
        type: 'release',
        color: 'rgb(76, 175, 80)', // Vert pour les releases
        size: 15,
        imageUrl: release.thumb
      });

      // Lien artiste -> release
      links.push({
        source: artist.id.toString(),
        target: `release-${release.id}`,
        type: 'release'
      });

      // Ajouter les labels de chaque release
      release.labels?.forEach(label => {
        const labelId = `label-${label.id}`;
        
        // Ajouter le label s'il n'existe pas déjà
        if (!nodes.find(n => n.id === labelId)) {
          nodes.push({
            id: labelId,
            name: label.name,
            type: 'label',
            color: 'rgb(33, 150, 243)', // Bleu pour les labels
            size: 20
          });
        }

        // Lien release -> label
        links.push({
          source: `release-${release.id}`,
          target: labelId,
          type: 'label'
        });
      });
    });

    // Ajouter les collaborations
    collaborations.forEach(collab => {
      nodes.push({
        id: collab.id.toString(),
        name: collab.name,
        type: 'artist',
        color: 'rgb(255, 64, 129)',
        size: 18,
        imageUrl: collab.thumb
      });

      links.push({
        source: artist.id.toString(),
        target: collab.id.toString(),
        type: 'collaboration'
      });
    });

    return { nodes, links };
  } catch (error) {
    console.error('Error building artist graph:', error);
    throw error;
  }
}

export async function createContext(_opts: FetchCreateContextFnOptions) {
  return {
    discogs: DiscogsAPI.getInstance(),
    buildArtistGraph,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;