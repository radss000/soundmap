const processReleases = (releases, existingNodes = new Map()) => {
    const nodes = new Map(existingNodes);
    const links = new Map();
    const artistsMap = new Map();
    const labelsMap = new Map();
  
    console.log('Processing releases:', releases); // Log releases being processed
  
    releases.forEach(release => {
      // Add release node
      if (!nodes.has(release.id)) {
        nodes.set(release.id, {
          id: release.id,
          name: release.title,
          type: NODE_TYPES.RELEASE,
          data: {
            ...release,
            tracks: [] // Initialize tracks array
          }
        });
      }
  
      // Add artist nodes and links
      release.artistNames.forEach(artistName => {
        const artistId = `artist-${artistName}`;
        if (!artistsMap.has(artistId)) {
          artistsMap.set(artistId, {
            id: artistId,
            name: artistName,
            type: NODE_TYPES.ARTIST,
            releaseCount: 1
          });
        } else {
          artistsMap.get(artistId).releaseCount++;
        }
  
        // Link release to artist
        const linkId = `${release.id}-${artistId}`;
        links.set(linkId, {
          source: release.id,
          target: artistId,
          type: 'artist_release'
        });
      });
  
      // Add label node and link (if label exists)
      if (release.labelName) {
        const labelId = `label-${release.labelName}`;
        if (!labelsMap.has(labelId)) {
          labelsMap.set(labelId, {
            id: labelId,
            name: release.labelName,
            type: NODE_TYPES.LABEL,
            releaseCount: 1
          });
        } else {
          labelsMap.get(labelId).releaseCount++;
        }
  
        // Link release to label
        const linkId = `${release.id}-${labelId}`;
        links.set(linkId, {
          source: release.id,
          target: labelId,
          type: 'label_release'
        });
      }
    });
  
    // Add artist and label nodes to the main nodes map
    for (const artist of artistsMap.values()) {
      nodes.set(artist.id, artist);
    }
    for (const label of labelsMap.values()) {
      nodes.set(label.id, label);
    }
  
    console.log('Processed nodes and links:', { nodes, links }); // Log processed nodes and links
    return { nodes, links };
  };