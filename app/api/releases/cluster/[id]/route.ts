import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { clusterReleases } from '@/lib/services/clustering';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (params.id === 'root') {
      // Load initial clusters
      const releases = await prisma.electronicRelease.findMany({
        take: 1000,
        select: {
          id: true,
          title: true,
          artistNames: true,
          labelName: true,
          styles: true,
        },
      });

      const { clusters, links } = clusterReleases(releases);
      
      return NextResponse.json({
        nodes: clusters,
        links: links
      });
    } else {
      // Load cluster details
      const clusterReleases = await prisma.electronicRelease.findMany({
        where: {
          styles: {
            hasSome: [params.id]
          }
        },
        take: 100,
        select: {
          id: true,
          title: true,
          artistNames: true,
          labelName: true,
          styles: true,
        },
      });

      return NextResponse.json({
        nodes: clusterReleases.map(release => ({
          id: release.id,
          name: release.title,
          type: 'release',
          artistNames: release.artistNames,
          labelName: release.labelName,
          styles: release.styles
        })),
        links: []
      });
    }
  } catch (error) {
    console.error('Cluster API error:', error);
    return NextResponse.json({ error: 'Failed to load cluster data' }, { status: 500 });
  }
}