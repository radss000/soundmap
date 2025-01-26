const BATCH_SIZE = 1000;
const CLUSTER_SIZE = 20;

let cachedNodes = new Map();
let cachedLinks = new Map();
let rawData = null;

function initNodePosition() {
 const angle = Math.random() * 2 * Math.PI;
 const r = Math.random() * 100;
 return {
   x: r * Math.cos(angle),
   y: r * Math.sin(angle),
   z: (Math.random() - 0.5) * 50
 };
}

function createCluster(nodes, clusterIndex) {
 const pos = initNodePosition();
 return {
   id: `cluster-${clusterIndex}`,
   name: `Cluster ${clusterIndex}`,
   nodes: nodes,
   type: 'cluster',
   val: 12,
   cluster: true,
   x: pos.x,
   y: pos.y,
   z: pos.z
 };
}

function processData(releases) {
 const nodes = [];
 const links = [];
 const clusters = [];
 const artistsMap = new Map();
 const labelsMap = new Map();

 let clusterIndex = 0;
 let clusterNodes = [];

 releases.forEach((release, index) => {
   const node = {
     ...initNodePosition(),
     id: release.id,
     name: release.title,
     type: 'release',
     data: release,
     val: 4
   };
   clusterNodes.push(node);

   if (clusterNodes.length === CLUSTER_SIZE || index === releases.length - 1) {
     const cluster = createCluster(clusterNodes, clusterIndex++);
     clusters.push(cluster);
     nodes.push(...clusterNodes);
     clusterNodes.forEach(n => {
       links.push({
         source: cluster.id,
         target: n.id,
         type: 'cluster'
       });
     });
     clusterNodes = [];
   }

   release.artistNames?.forEach(artistName => {
     const artistId = `artist-${artistName}`;
     if (!artistsMap.has(artistId)) {
       const artistNode = {
         ...initNodePosition(),
         id: artistId,
         name: artistName,
         type: 'artist',
         val: 6,
         releaseCount: 1
       };
       artistsMap.set(artistId, artistNode);
       nodes.push(artistNode);
     } else {
       artistsMap.get(artistId).releaseCount++;
     }

     links.push({
       source: release.id,
       target: artistId,
       type: 'artist_release'
     });
   });

   if (release.labelName) {
     const labelId = `label-${release.labelName}`;
     if (!labelsMap.has(labelId)) {
       const labelNode = {
         ...initNodePosition(),
         id: labelId,
         name: release.labelName,
         type: 'label',
         val: 8,
         releaseCount: 1
       };
       labelsMap.set(labelId, labelNode);
       nodes.push(labelNode);
     } else {
       labelsMap.get(labelId).releaseCount++;
     }

     links.push({
       source: release.id,
       target: labelId,
       type: 'label_release'
     });
   }
 });

 return {
   nodes: [...nodes, ...clusters],
   links
 };
}

self.onmessage = (e) => {
 const { type, data, nodeId, center, radius, term } = e.data;

 switch (type) {
   case 'INIT': {
     rawData = data;
     const processed = processData(data);
     cachedNodes = new Map(processed.nodes.map(n => [n.id, n]));
     cachedLinks = new Map(processed.links.map(l => [`${l.source}-${l.target}`, l]));
     self.postMessage(processed);
     break;
   }

   case 'LOAD_CHUNK': {
     const { start, size } = data;
     const chunk = processData(rawData.slice(start, start + size));
     self.postMessage(chunk);
     break;
   }
   
   case 'EXPAND_CLUSTER': {
     const cluster = cachedNodes.get(nodeId);
     if (cluster?.nodes) {
       self.postMessage({
         nodes: cluster.nodes,
         links: []
       });
     }
     break;
   }

   case 'UPDATE_VISIBLE': {
     const visibleNodes = Array.from(cachedNodes.values()).filter(node => {
       const dx = node.x - center.x;
       const dy = node.y - center.y;
       const dz = node.z - center.z;
       return Math.sqrt(dx * dx + dy * dy + dz * dz) <= radius;
     });

     const visibleLinks = Array.from(cachedLinks.values()).filter(link => {
       const sourceNode = cachedNodes.get(link.source);
       const targetNode = cachedNodes.get(link.target);
       return sourceNode && targetNode;
     });

     self.postMessage({ nodes: visibleNodes, links: visibleLinks });
     break;
   }

   case 'SEARCH': {
     if (!term) {
       self.postMessage(processData(rawData.slice(0, BATCH_SIZE)));
       return;
     }

     const termLower = term.toLowerCase();
     const matches = rawData.filter(release =>
       release.title.toLowerCase().includes(termLower) ||
       release.artistNames.some(artist => artist.toLowerCase().includes(termLower)) ||
       release.labelName?.toLowerCase().includes(termLower)
     );

     self.postMessage(processData(matches));
     break;
   }
 }
};