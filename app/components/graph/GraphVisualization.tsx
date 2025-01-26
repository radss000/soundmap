import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, ZoomIn, ZoomOut, Search } from 'lucide-react';
import _ from 'lodash';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

const NODE_LIMIT = 10000; // Augmenté pour plus de releases
const PARTICLES_PER_LINE = 4;

const NODE_COLORS = {
  cluster: {
    House: '#FF1493',
    Techno: '#4169E1', 
    'Deep House': '#32CD32',
    Ambient: '#9370DB',
    Trance: '#FF4500',
    default: '#1E90FF'
  },
  release: '#4682B4',
  selected: '#FFD700'
};

const GraphVisualization = () => {
  const graphRef = useRef();
  const [data, setData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [originalData, setOriginalData] = useState({ nodes: [], links: [] });

  const processLinks = useMemo(() => (releases, nodes) => {
    const links = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Links to style clusters
    releases.slice(0, NODE_LIMIT).forEach(release => {
      const style = release.styles?.[0];
      if (style) {
        links.push({
          source: release.id,
          target: `cluster-${style}`,
          value: 1
        });
      }
    });

    // Links between same-label releases
    for (let i = 0; i < releases.length - 1; i++) {
      if (links.length >= NODE_LIMIT * 2) break;
      if (releases[i].labelName === releases[i + 1].labelName) {
        if (nodeMap.has(releases[i].id) && nodeMap.has(releases[i + 1].id)) {
          links.push({
            source: releases[i].id,
            target: releases[i + 1].id,
            value: 1
          });
        }
      }
    }

    return links;
  }, []);

  const processNodes = useMemo(() => (releases) => {
    const styleGroups = _.groupBy(releases, r => r.styles?.[0] || 'Unknown');
    
    const clusters = Object.entries(styleGroups).map(([style, items]) => ({
      id: `cluster-${style}`,
      name: style,
      type: 'cluster',
      size: Math.sqrt(items.length) * 2,
      color: NODE_COLORS.cluster[style] || NODE_COLORS.cluster.default,
      childCount: items.length,
      data: { type: 'cluster', style, count: items.length }
    }));

    const nodes = releases.slice(0, NODE_LIMIT).map(release => ({
      id: release.id,
      name: release.title,
      type: 'release',
      size: 3,
      color: NODE_COLORS.release,
      data: release
    }));

    return [...clusters, ...nodes];
  }, []);

  const filterNodes = useCallback((nodes, term) => {
    if (!term) return nodes;
    const lowerTerm = term.toLowerCase();
    return nodes.filter(node => 
      node.name.toLowerCase().includes(lowerTerm) ||
      node.data?.artistNames?.some(artist => artist.toLowerCase().includes(lowerTerm)) ||
      node.data?.labelName?.toLowerCase().includes(lowerTerm)
    );
  }, []);

  const fetchData = async () => {
    const response = await fetch('/api/releases/2008');
    const releases = await response.json();
    const nodes = processNodes(releases);
    const links = processLinks(releases, nodes);
    setOriginalData({ nodes, links });
    setData({ nodes, links });
  };

  useEffect(() => {
    
    if (searchTerm) {
      const filteredNodes = filterNodes(originalData.nodes, searchTerm);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredLinks = originalData.links.filter(l => 
        nodeIds.has(l.source.id || l.source) && nodeIds.has(l.target.id || l.target)
      );
      setData({ nodes: filteredNodes, links: filteredLinks });
    } else {
      setData(originalData);
    }
  }, [searchTerm, originalData, filterNodes, processLinks, processNodes]);

  const handleNodeClick = useCallback((node) => {
    if (!node || !graphRef.current) return;

    // Zoom sur le nœud
    const distance = 50;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
    graphRef.current.cameraPosition(
      { 
        x: node.x * distRatio, 
        y: node.y * distRatio, 
        z: node.z * distRatio 
      },
      node,
      2000
    );

    // Highlight du nœud sélectionné
    setData(prevData => ({
      ...prevData,
      nodes: prevData.nodes.map(n => ({
        ...n,
        color: n.id === node.id ? NODE_COLORS.selected : 
               n.type === 'cluster' ? NODE_COLORS.cluster[n.name] || NODE_COLORS.cluster.default :
               NODE_COLORS.release
      }))
    }));

    setSelectedNode(node);
  }, []);

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
              setSelectedNode(null);
            }}
            className="bg-black/50 text-white hover:bg-black/70">
            <Home className="w-4 h-4 mr-2" />
            Reset View
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                const { x, y, z } = graphRef.current.cameraPosition();
                graphRef.current.cameraPosition(
                  { x: x * 0.8, y: y * 0.8, z: z * 0.8 },
                  { x: 0, y: 0, z: 0 },
                  1000
                );
              }}
              className="bg-black/50 text-white hover:bg-black/70">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const { x, y, z } = graphRef.current.cameraPosition();
                graphRef.current.cameraPosition(
                  { x: x * 1.2, y: y * 1.2, z: z * 1.2 },
                  { x: 0, y: 0, z: 0 },
                  1000
                );
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-black/50 text-white border-white/20 w-64"
          />
        </div>
      </div>

      <ForceGraph3D
        ref={graphRef}
        graphData={data}
        nodeLabel="name"
        backgroundColor="#000000"
        nodeRelSize={node => node.type === 'cluster' ? 8 : 4}
        nodeResolution={16}
        linkDirectionalParticles={PARTICLES_PER_LINE}
        linkDirectionalParticleSpeed={0.005}
        linkWidth={0.5}
        linkOpacity={0.2}
        onNodeClick={handleNodeClick}
        onNodeHover={setHoveredNode}
        nodeThreeObject={node => {
          const geometry = new THREE.SphereGeometry(node.size);
          const material = new THREE.MeshPhongMaterial({
            color: node.color,
            transparent: true,
            opacity: hoveredNode === node ? 1 : 0.75,
            shininess: 100
          });
          return new THREE.Mesh(geometry, material);
        }}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={100}
        cooldownTicks={50}
        cooldownTime={2000}
      />

      {selectedNode && (
        <Card className="absolute top-4 right-4 p-4 w-96 bg-black/80 backdrop-blur-sm text-white border-white/20">
          <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
          <div className="space-y-2">
            {selectedNode.type === 'cluster' ? (
              <>
                <p>Type: Style Cluster</p>
                <p>Releases: {selectedNode.childCount}</p>
              </>
            ) : (
              <>
                {selectedNode.data?.artistNames && (
                  <p>Artists: {selectedNode.data.artistNames.join(', ')}</p>
                )}
                {selectedNode.data?.labelName && (
                  <p>Label: {selectedNode.data.labelName}</p>
                )}
                {selectedNode.data?.year && (
                  <p>Year: {selectedNode.data.year}</p>
                )}
                {selectedNode.data?.styles && (
                  <p>Styles: {selectedNode.data.styles.join(', ')}</p>
                )}
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default GraphVisualization;