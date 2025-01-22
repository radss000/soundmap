/*
  Warnings:

  - You are about to drop the `Artist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArtistCollaboration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Label` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Release` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Remix` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ArtistCollaboration" DROP CONSTRAINT "ArtistCollaboration_artistId_fkey";

-- DropForeignKey
ALTER TABLE "Release" DROP CONSTRAINT "Release_artistId_fkey";

-- DropForeignKey
ALTER TABLE "Release" DROP CONSTRAINT "Release_labelId_fkey";

-- DropForeignKey
ALTER TABLE "Remix" DROP CONSTRAINT "Remix_originalId_fkey";

-- DropForeignKey
ALTER TABLE "Remix" DROP CONSTRAINT "Remix_remixerId_fkey";

-- DropTable
DROP TABLE "Artist";

-- DropTable
DROP TABLE "ArtistCollaboration";

-- DropTable
DROP TABLE "Label";

-- DropTable
DROP TABLE "Release";

-- DropTable
DROP TABLE "Remix";

-- CreateTable
CREATE TABLE "electronic_releases_2008" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "country" TEXT,
    "artistNames" TEXT[],
    "labelName" TEXT,
    "labelCatno" TEXT,
    "genres" TEXT[],
    "styles" TEXT[],
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "electronic_releases_2008_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "position" TEXT,
    "title" TEXT NOT NULL,
    "duration" TEXT,
    "artists" TEXT[],
    "releaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "electronic_releases_2008"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
