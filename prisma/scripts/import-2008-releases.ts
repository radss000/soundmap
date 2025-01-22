import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importReleases() {
  try {
    const filePath = path.join(process.cwd(), 'prisma', 'scripts', 'electronic_releases_2008.json');
    console.log('Reading file from:', filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    let buffer = '';

    stream.on('data', async (chunk) => {
      buffer += chunk;
      const releases = buffer.split('\n').filter((line) => line.trim() !== '');

      for (const release of releases) {
        try {
          const releaseData = JSON.parse(release);
          console.log('Importing release:', releaseData.title);

          const createdRelease = await prisma.electronicRelease.create({
            data: {
              title: releaseData.title,
              year: releaseData.year,
              country: releaseData.country,
              artistNames: releaseData.artists?.map((artist: any) => artist.name) || [],
              labelName: releaseData.labels?.[0]?.name,
              labelCatno: releaseData.labels?.[0]?.catno,
              genres: releaseData.genres || [],
              styles: releaseData.styles || [],
              imageUrl: releaseData.thumb,
              notes: releaseData.notes,
              tracks: {
                create: releaseData.tracklist?.map((track: any) => ({
                  position: track.position,
                  title: track.title,
                  duration: track.duration,
                  artists: track.artists?.map((artist: any) => artist.name) || [],
                })),
              },
            },
          });

          console.log('Created release:', createdRelease.id);
        } catch (error) {
          console.error('Error importing release:', error);
        }
      }

      buffer = '';
    });

    stream.on('end', () => {
      console.log('Releases imported successfully');
    });

    stream.on('error', (error) => {
      console.error('Error reading file:', error);
    });
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importReleases();