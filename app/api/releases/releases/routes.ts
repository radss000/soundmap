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
    take: 1000
  });