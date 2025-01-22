const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const es = require('event-stream');

const prisma = new PrismaClient();

async function importReleases() {
  try {
    const filePath = path.join(process.cwd(), 'prisma', 'scripts', 'electronic_releases_2008.json');
    let isFirstChunk = true;
    let imported = 0;

    const jsonStream = fs.createReadStream(filePath, {encoding: 'utf8'})
      .pipe(es.split(/,\s*\n\s*{\s*"id":/))
      .pipe(new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          try {
            if (!chunk.trim()) {
              return callback();
            }

            let jsonStr = chunk;
            if (isFirstChunk) {
              // Extract releases array from first chunk
              const match = chunk.match(/"releases":\s*\[\s*{\s*"id":(.+)/s);
              if (match) {
                jsonStr = `{"id":${match[1]}`;
                isFirstChunk = false;
              } else {
                return callback();
              }
            } else {
              jsonStr = `{"id":${chunk}`;
            }

            const release = JSON.parse(jsonStr);
            callback(null, release);
          } catch (error) {
            console.error('Error parsing JSON:', error);
            callback();
          }
        }
      }));

    for await (const releaseData of jsonStream) {
      try {
        await prisma.electronicRelease.create({
          data: {
            title: releaseData.title,
            year: releaseData.year || 2008,
            country: releaseData.country,
            artistNames: releaseData.artists?.map(artist => artist.name) || [],
            labelName: releaseData.labels?.[0]?.name,
            labelCatno: releaseData.labels?.[0]?.catno,
            genres: releaseData.genres || [],
            styles: releaseData.styles || [],
            imageUrl: releaseData.images?.[0]?.uri,
            notes: releaseData.notes,
            tracks: {
              create: releaseData.tracklist?.map(track => ({
                position: track.position,
                title: track.title,
                duration: track.duration,
                artists: track.artists?.map(artist => artist.name) || []
              }))
            }
          }
        });
        
        imported++;
        if (imported % 100 === 0) {
          console.log(`Imported ${imported} releases`);
        }
      } catch (error) {
        console.error(`Error importing release: ${error.message}`);
      }
    }

    console.log(`Import completed. Total imported: ${imported} releases`);
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importReleases();