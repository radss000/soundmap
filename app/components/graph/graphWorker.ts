const NODE_TYPES = {
    RELEASE: 'release',
    ARTIST: 'artist',
    LABEL: 'label'
  };
  
  let cachedNodes = new Map();
  let cachedLinks = new Map();
  let rawData = null;
  
  const processReleases = (releases, existingNodes = new Map()) => {
    const nodes = new Map(existingNodes);
    const links = new Map();
    const artistsMap = new Map();
    const labelsMap = new Map();
  
    console.log('Processing releases:', releases); // Log releases being processed
  
    releases.forEach(release => {
      if (!nodes.has(release.id)) {
        nodes.set(release.id, {
          id: release.id,
          name: release.title,
          type: NODE_TYPES.RELEASE,
          data: release
        });
      }
  
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
  
        const linkId = `${release.id}-${artistId}`;
        links.set(linkId, {
          source: release.id,
          target: artistId,
          type: 'artist_release'
        });
      });
  
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
  
        const linkId = `${release.id}-${labelId}`;
        links.set(linkId, {
          source: release.id,
          target: labelId,
          type: 'label_release'
        });
      }
    });
  
    for (const artist of artistsMap.values()) {
      nodes.set(artist.id, artist);
    }
    for (const label of labelsMap.values()) {
      nodes.set(label.id, label);
    }
  
    console.log('Processed nodes and links:', { nodes, links }); // Log processed nodes and links
    return { nodes, links };
  };
  
  const findNodesInRadius = (center, radius, nodeMap) => {
    return Array.from(nodeMap.values()).filter(node => {
      if (!node.x || !node.y || !node.z) return false;
      const dx = node.x - center.x;
      const dy = node.y - center.y;
      const dz = node.z - center.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) <= radius;
    });
  };
  
  self.onmessage = (e) => {
    const { type, data } = e.data;
    console.log('Worker received message:', type, data); // Log worker messages
  
    switch (type) {
      case 'INIT':
        console.log('Initializing worker with data:', data); // Log initialization
        rawData = data;
        const initial = processReleases(data);
        cachedNodes = initial.nodes;
        cachedLinks = initial.links;
        console.log('Processed nodes and links:', { nodes: Array.from(cachedNodes.values()), links: Array.from(cachedLinks.values()) }); // Log processed data
        self.postMessage({
          nodes: Array.from(cachedNodes.values()),
          links: Array.from(cachedLinks.values())
        });
        break;
  
      case 'LOAD_CONNECTED':
        const { nodeId } = e.data;
        const connectedLinks = Array.from(cachedLinks.values())
          .filter(link => link.source === nodeId || link.target === nodeId);
        const connectedNodeIds = new Set(
          connectedLinks.flatMap(link => [link.source, link.target])
        );
        self.postMessage({
          nodes: Array.from(cachedNodes.values())
            .filter(node => connectedNodeIds.has(node.id)),
          links: connectedLinks
        });
        break;
  
      case 'SEARCH':
        const { term } = e.data;
        const searchLower = term.toLowerCase();
        const matches = rawData.filter(release =>
          release.title.toLowerCase().includes(searchLower) ||
          release.artistNames.some(artist => artist.toLowerCase().includes(searchLower)) ||
          release.labelName?.toLowerCase().includes(searchLower)
        ).slice(0, 1000);
        const searchResults = processReleases(matches);
        self.postMessage({
          nodes: Array.from(searchResults.nodes.values()),
          links: Array.from(searchResults.links.values())
        });
        break;
  
      case 'RESET':
        const reset = processReleases(data || rawData);
        cachedNodes = reset.nodes;
        cachedLinks = reset.links;
        self.postMessage({
          nodes: Array.from(cachedNodes.values()),
          links: Array.from(cachedLinks.values())
        });
        break;
    }
  };