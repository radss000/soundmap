// app/api/releases/route.ts
import { prisma } from '@/server/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const releases = await prisma.electronicRelease.findMany({
      select: {
        id: true,
        title: true,
        year: true,
        artistNames: true,
        labelName: true,
        genres: true,
        styles: true
      },
      take: 1000 // Limite pour des performances optimales
    });
    
    return NextResponse.json(releases);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch releases' }, 
      { status: 500 }
    );
  }
}