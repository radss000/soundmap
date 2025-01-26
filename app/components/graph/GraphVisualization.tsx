'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, ZoomIn, ZoomOut, Search } from 'lucide-react';
import { debounce } from 'lodash';

// Worker for heavy computations
const worker = new Worker(new URL('./graphWorker.ts', import.meta.url));

const ForceGraph = dynamic(() => 
  import('react-force-graph-3d').then(mod => {
    const ForceGraphComponent = React.forwardRef((props, ref) => 
      <mod.default {...props} ref={ref} />
    );
    ForceGraphComponent.displayName = 'ForceGraph';
    return ForceGraphComponent;
  }), { ssr: false }
);

const NODE_TYPES = {
  RELEASE: 'release',
  ARTIST: 'artist',
  LABEL: 'label'
};

const NODE_COLORS = {
  release: '#4CAF50',
  artist: '#2196F3',
  label: '#FF4081',
  selected: '#FFD700'
};

// Precomputed geometries
const GEOMETRIES = {
  release: new THREE.SphereGeometry(3, 16, 16),
  artist: new THREE.SphereGeometry(5, 24, 24),
  label: new THREE.SphereGeometry(4, 20, 20)
};

const BATCH_SIZE = 1000;
const VISIBLE_RADIUS = 100;

const GraphVisualization = () => {
  const graphRef = useRef();
  const [graphState, setGraphState] = useState({
    visibleNodes: new Set(),
    cachedNodes: new Map(),
    links: new Map(),
    center: { x: 0, y: 0, z: 0 }
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState(null);

  const materialsCache = useMemo(() => {
    return Object.entries(NODE_COLORS).reduce((cache, [type, color]) => {
      cache[type] = new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        shininess: 50
      });
      return cache;
    }, {});
  }, []);

  useEffect(() => {
    worker.onmessage = (e) => {
      const { nodes, links } = e.data;
      console.log('Worker returned nodes and links:', { nodes, links }); // Log worker response
      setGraphState(prev => ({
        ...prev,
        visibleNodes: new Set([...prev.visibleNodes, ...nodes.map(n => n.id)]),
        cachedNodes: new Map([...prev.cachedNodes, ...nodes.map(n => [n.id, n])]),
        links: new Map([...prev.links, ...links.map(l => [`${l.source}-${l.target}`, l])])
      }));
    };
  
    return () => worker.terminate();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/releases/2008');
        const releases = await response.json();
        console.log('Fetched Releases:', releases); // Log fetched data
        setRawData(releases);
  
        // Send INIT message to worker
        worker.postMessage({ 
          type: 'INIT',
          data: releases.slice(0, BATCH_SIZE),
          radius: VISIBLE_RADIUS 
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);
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
  const nodeThreeObject = useCallback((node) => {
    if (!graphState.visibleNodes.has(node.id)) {
      console.log('Node not visible:', node.id); // Log invisible nodes
      return null;
    }

    const geometry = GEOMETRIES[node.type];
    const material = materialsCache[selectedNode?.id === node.id ? 'selected' : node.type].clone();
    console.log('Creating 3D object for node:', node.id); // Log node 3D object creation
    return new THREE.Mesh(geometry, material);
  }, [graphState.visibleNodes, selectedNode, materialsCache]);

  const handleCameraMove = useCallback(debounce((position) => {
    const { x, y, z } = position;
    console.log('Camera moved to:', { x, y, z }); // Log camera movement
    worker.postMessage({
      type: 'UPDATE_VISIBLE',
      center: { x, y, z },
      radius: VISIBLE_RADIUS
    });
  }, 100), []);

  const handleNodeClick = useCallback((node) => {
    if (!node) return;

    const distance = 50;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
    
    graphRef.current?.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      2000
    );

    setSelectedNode(node);
    console.log('Node clicked:', node.id); // Log node click

    // Load connected nodes
    worker.postMessage({
      type: 'LOAD_CONNECTED',
      nodeId: node.id,
      radius: 50
    });
  }, []);

  const handleSearch = useCallback(debounce((term) => {
    if (!term || !rawData) {
      console.log('Resetting search'); // Log search reset
      worker.postMessage({ 
        type: 'RESET',
        data: rawData?.slice(0, BATCH_SIZE)
      });
      return;
    }

    console.log('Searching for term:', term); // Log search term
    worker.postMessage({
      type: 'SEARCH',
      term,
      data: rawData
    });
  }, 300), [rawData]);

  const graphData = useMemo(() => {
    const nodes = Array.from(graphState.cachedNodes.values())
      .filter(node => graphState.visibleNodes.has(node.id));
    const links = Array.from(graphState.links.values())
      .filter(link => 
        graphState.visibleNodes.has(link.source) && 
        graphState.visibleNodes.has(link.target)
      );

    console.log('Graph Data:', { nodes, links }); // Log graph data
    return { nodes, links };
  }, [graphState]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white">
        Loading visualization...
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-4">
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => {
              graphRef.current?.cameraPosition(
                { x: 0, y: 0, z: 300 },
                { x: 0, y: 0, z: 0 },
                2000
              );
              worker.postMessage({ 
                type: 'RESET',
                data: rawData?.slice(0, BATCH_SIZE)
              });
              setSelectedNode(null);
              console.log('View reset'); // Log view reset
            }}
            className="bg-black/50 text-white hover:bg-black/70">
            <Home className="w-4 h-4 mr-2" />
            Reset View
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                const {x, y, z} = graphRef.current.cameraPosition();
                graphRef.current.cameraPosition(
                  {x: x * 0.8, y: y * 0.8, z: z * 0.8},
                  {x: 0, y: 0, z: 0},
                  1000
                );
                console.log('Zoomed in'); // Log zoom in
              }}
              className="bg-black/50 text-white hover:bg-black/70">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const {x, y, z} = graphRef.current.cameraPosition();
                graphRef.current.cameraPosition(
                  {x: x * 1.2, y: y * 1.2, z: z * 1.2},
                  {x: 0, y: 0, z: 0},
                  1000
                );
                console.log('Zoomed out'); // Log zoom out
              }}
              className="bg-black/50 text-white hover:bg-black/70">
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search releases, artists, labels..."
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 bg-black/50 text-white border-white/20 w-64"
          />
        </div>
      </div>

      <ForceGraph
        ref={graphRef}
        graphData={graphData}
        nodeLabel="name"
        backgroundColor="#000000"
        nodeThreeObject={nodeThreeObject}
        linkWidth={1}
        linkOpacity={0.3}
        linkColor={() => '#ffffff'}
        onNodeClick={handleNodeClick}
        onCameraPositionChange={handleCameraMove}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        onEngineTick={() => {
          const pos = graphRef.current?.camera().position;
          if (pos) handleCameraMove(pos);
        }}
      />

      {selectedNode && (
        <Card className="absolute top-4 right-4 p-4 w-96 bg-black/80 backdrop-blur-sm text-white border-white/20">
          <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
          <div className="space-y-2">
            {selectedNode.type === NODE_TYPES.RELEASE ? (
              <>
                <p>Artists: {selectedNode.data.artistNames.join(', ')}</p>
                {selectedNode.data.labelName && <p>Label: {selectedNode.data.labelName}</p>}
                <p>Styles: {selectedNode.data.styles.join(', ')}</p>
                <p>Year: {selectedNode.data.year}</p>
                {selectedNode.data.tracks?.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Tracklist:</p>
                    <div className="max-h-60 overflow-y-auto">
                      {selectedNode.data.tracks.map((track, idx) => (
                        <div key={idx} className="py-1">
                          {track.position && <span className="text-gray-400 mr-2">{track.position}</span>}
                          <span>{track.title}</span>
                          {track.duration && <span className="text-gray-400 ml-2">({track.duration})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : selectedNode.type === NODE_TYPES.ARTIST ? (
              <>
                <p>Artist</p>
                <p>Releases: {selectedNode.releaseCount}</p>
              </>
            ) : (
              <>
                <p>Label</p>
                <p>Releases: {selectedNode.releaseCount}</p>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default GraphVisualization;