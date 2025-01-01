export const mockNodes = [
  { id: '1', name: 'Daft Punk', type: 'artist', color: '#ff4081', size: 20 },
  { id: '2', name: 'Justice', type: 'artist', color: '#ff4081', size: 15 },
  { id: '3', name: 'Ed Banger Records', type: 'label', color: '#00bcd4', size: 18 },
  { id: '4', name: 'Random Access Memories', type: 'release', color: '#4caf50', size: 12 },
  { id: '5', name: 'Cross', type: 'release', color: '#4caf50', size: 12 },
  { id: '6', name: 'The Chemical Brothers', type: 'artist', color: '#ff4081', size: 17 },
  { id: '7', name: 'Virgin Records', type: 'label', color: '#00bcd4', size: 16 },
  { id: '8', name: 'Homework', type: 'release', color: '#4caf50', size: 12 },
];

export const mockLinks = [
  { source: '1', target: '4', type: 'release' },
  { source: '1', target: '7', type: 'release' },
  { source: '2', target: '3', type: 'release' },
  { source: '2', target: '5', type: 'release' },
  { source: '6', target: '7', type: 'release' },
  { source: '1', target: '8', type: 'release' },
  { source: '1', target: '2', type: 'collaboration' },
];