import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET() {
  try {
    // Adding proper error logging
    console.log('Fetching releases from database');
    
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
        styles: true,
        imageUrl: true
      },
      orderBy: {
        id: 'asc'
      },
      take: 10000 // Limit initial load
    });

    if (!releases) {
      console.error('No releases found');
      return NextResponse.json({ error: 'No releases found' }, { status: 404 });
    }

    console.log(`Found ${releases.length} releases`);
    return NextResponse.json(releases);
    
  } catch (error) {
    // Detailed error logging
    console.error('Failed to fetch releases:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch releases',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}