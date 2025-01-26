import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import * as d3 from 'd3';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { SlidersHorizontal, ZoomIn, ZoomOut, Home } from 'lucide-react';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

// Fixed similarity calculation
const calculateSimilarity = (genre1, genre2) => {
  const set1 = new Set(genre1.styles || []);
  const set2 = new Set(genre2.styles || []);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
};

// Fixed link strength calculation
const calculateLinkStrength = (node1, node2) => {
  if (node1.type !== node2.type) return 0.5;
  return node1.type === 'genre' ? 
    calculateSimilarity(node1.data || {}, node2.data || {}) : 0.7;
};

// Fixed node linking logic
const shouldLink = (node1, node2) => {
  if (node1.type !== node2.type) return false;
  const similarity = calculateSimilarity(node1.data || {}, node2.data || {});
  return similarity > 0.3;
};

const CLUSTER_LEVELS = {
  GENRE: { level: 1, maxNodes: 20, radius: 100 },
  SUBGENRE: { level: 2, maxNodes: 50, radius: 50 },
  DETAIL: { level: 3, maxNodes: 100, radius: 25 }
};

const COLOR_SCHEME = {
  genre: '#2196F3',
  subgenre: '#4CAF50',
  artist: '#FF4081',
  label: '#FFC107',
  release: '#9C27B0',
  default: '#9E9E9E'
};

const getColorForNode = (node) => {
  const color = COLOR_SCHEME[node.type] || COLOR_SCHEME.default;
  return `#${color.getHexString()}`;
};

const calculateNodeSize = (node) => {
  const baseSizes = {
    genre: 20,
    subgenre: 15,
    artist: 10,
    label: 12,
    release: 8
  };
  const size = baseSizes[node.type] || 10;
  return node.childCount ? Math.max(size, Math.sqrt(node.childCount)) : size;
};

const MusicGraph = () => {
  const graphRef = useRef();
  const [data, setData] = useState({ nodes: [], links: [] });
  const [currentLevel, setCurrentLevel] = useState(CLUSTER_LEVELS.GENRE);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  const initializeGraph = useCallback(async () => {
    try {
      const response = await fetch('/api/releases/2008');
      const releases = await response.json();
      
      const genreClusters = d3.group(releases, d => d.genres?.[0] || 'Unknown');
      
      const nodes = Array.from(genreClusters).map(([genre, items]) => ({
        id: `genre-${genre}`,
        name: genre,
        type: 'genre',
        val: calculateNodeSize({ type: 'genre', childCount: items.length }),
        color: getColorForNode({ type: 'genre' }),
        data: { styles: [...new Set(items.flatMap(item => item.styles || []))] },
        childCount: items.length,
        level: CLUSTER_LEVELS.GENRE.level
      }));

      const links = nodes.reduce((acc, node1, i) => {
        nodes.slice(i + 1).forEach(node2 => {
          if (shouldLink(node1, node2)) {
            acc.push({
              source: node1.id,
              target: node2.id,
              value: calculateLinkStrength(node1, node2)
            });
          }
        });
        return acc;
      }, []);

      setData({ nodes, links });
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize graph:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);

  const handleNodeClick = useCallback(async (node, event) => {
    if (!node || !graphRef.current) return;

    event?.preventDefault();
    event?.stopPropagation();

    setSelectedNode(node);

    const distance = 120;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
    
    graphRef.current.pauseAnimation();
    
    graphRef.current.cameraPosition(
      { 
        x: node.x * distRatio, 
        y: node.y * distRatio, 
        z: node.z * distRatio 
      },
      node,
      1500
    );

    try {
      const response = await fetch(`/api/releases/cluster/${node.id}`);
      const details = await response.json();

      const newData = processDetailedData(details, node);
      setData(newData);
    } catch (error) {
      console.error('Error loading node details:', error);
    }

    setTimeout(() => {
      if (graphRef.current) {
        graphRef.current.resumeAnimation();
      }
    }, 2000);
  }, []);

  const processDetailedData = (details, parentNode) => {
    const nodes = details.nodes.map(node => ({
      ...node,
      val: calculateNodeSize(node),
      color: getColorForNode(node),
      parent: parentNode.id,
      level: currentLevel.level + 1
    }));

    const links = details.links.map(link => ({
      ...link,
      value: 1,
      color: 'rgba(255,255,255,0.2)'
    }));

    return { nodes, links };
  };

  const handleResetView = useCallback(() => {
    if (!graphRef.current) return;
    
    setSelectedNode(null);
    graphRef.current.cameraPosition(
      { x: 0, y: 0, z: 300 },
      { x: 0, y: 0, z: 0 },
      2000
    );
    
    initializeGraph();
  }, [initializeGraph]);

  const handleZoom = useCallback((factor) => {
    if (!graphRef.current) return;
    
    const { x, y, z } = graphRef.current.cameraPosition();
    const distance = Math.sqrt(x*x + y*y + z*z);
    
    graphRef.current.cameraPosition(
      { 
        x: x * factor, 
        y: y * factor, 
        z: z * factor 
      },
      { x: 0, y: 0, z: 0 },
      1000
    );
  }, []);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-black via-gray-900 to-blue-900">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-4">
        <Button 
          variant="outline" 
          className="bg-black/50 text-white hover:bg-black/70"
          onClick={handleResetView}>
          <Home className="w-4 h-4 mr-2" />
          Reset View
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-black/50 text-white hover:bg-black/70"
            onClick={() => handleZoom(0.8)}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            className="bg-black/50 text-white hover:bg-black/70"
            onClick={() => handleZoom(1.2)}>
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ForceGraph3D
        ref={graphRef}
        graphData={data}
        nodeLabel={node => node.name}
        nodeColor={node => getColorForNode(node)}
        nodeVal={node => node.val}
        nodeResolution={16}
        nodeOpacity={0.75}
        linkWidth={1}
        linkOpacity={0.2}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={2}
        backgroundColor="transparent"
        showNavInfo={false}
        onNodeClick={handleNodeClick}
        onBackgroundClick={() => setSelectedNode(null)}
        nodeThreeObject={node => {
          if (node.type === 'genre' || node.type === 'subgenre') {
            const geometry = new THREE.SphereGeometry(node.val);
            const material = new THREE.MeshPhongMaterial({
              color: getColorForNode(node),
              transparent: true,
              opacity: 0.75,
              shininess: 100
            });
            return new THREE.Mesh(geometry, material);
          }
          return null;
        }}
        nodeThreeObjectExtend={true}
        d3Force={(d3Force) => {
          d3Force.force('link').distance(50).strength(0.1);
          d3Force.force('charge').strength(-120).distanceMax(200);
          d3Force.force('center').strength(0.05);
          d3Force.force('collision', d3.forceCollide()
            .radius(node => Math.cbrt(node.val) * 5)
            .strength(0.8)
            .iterations(3)
          );
        }}
      />

      {selectedNode && (
        <Card className="absolute top-4 right-4 p-4 w-96 bg-black/80 backdrop-blur-sm text-white border-none">
          <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
          <div className="space-y-2">
            <p className="text-gray-300">Type: {selectedNode.type}</p>
            {selectedNode.childCount && (
              <p className="text-gray-300">Contains: {selectedNode.childCount} items</p>
            )}
            {selectedNode.data && (
              <>
                {selectedNode.data.artistNames && (
                  <p className="text-gray-300">Artists: {selectedNode.data.artistNames.join(', ')}</p>
                )}
                {selectedNode.data.labelName && (
                  <p className="text-gray-300">Label: {selectedNode.data.labelName}</p>
                )}
                {selectedNode.data.styles && (
                  <p className="text-gray-300">Styles: {selectedNode.data.styles.join(', ')}</p>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-xl">Loading visualization...</div>
        </div>
      )}
    </div>
  );
};

export default MusicGraph;