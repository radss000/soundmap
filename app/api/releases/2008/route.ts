// app/api/releases/2008/route.ts
import { prisma } from '@/server/db';

export async function GET() {
  try {
    const releases = await prisma.electronicRelease.findMany({
      where: {
        year: 2008
      },
      select: {
        id: true,
        title: true,
        year: true,
        artistNames: true,
        labelName: true,
        genres: true,
        styles: true
      }
    });
    
    return Response.json(releases);
  } catch (error) {
    console.error('Failed to fetch releases:', error);
    return Response.json({ error: 'Failed to fetch releases' }, { status: 500 });
  }
}