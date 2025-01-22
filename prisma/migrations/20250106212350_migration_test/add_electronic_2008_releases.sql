-- prisma/migrations/[timestamp]_add_electronic_releases_2008.sql
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
CREATE TABLE "track_items" (
    "id" TEXT NOT NULL,
    "position" TEXT,
    "title" TEXT NOT NULL,
    "duration" TEXT,
    "releaseId" TEXT NOT NULL,
    "artists" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "track_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "track_items" ADD CONSTRAINT "track_items_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "electronic_releases_2008"("id") ON DELETE RESTRICT ON UPDATE CASCADE;