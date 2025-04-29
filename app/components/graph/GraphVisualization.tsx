'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, ZoomIn, ZoomOut, Search, X } from 'lucide-react';
import _ from 'lodash';

// Dynamic import for ForceGraph to work with SSR
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="bg-black/50 backdrop-blur-sm text-white p-4 rounded-md">
        Loading visualization...
      </div>
    </div>
  )
});

// Maximum number of releases to display for performance
const NODE_LIMIT = 1000;

// Color scheme for different node types
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panelVisible, setPanelVisible] = useState(false);

  // Debug effect to log selected node changes
  useEffect(() => {
    console.log("selectedNode changed:", selectedNode);
    // Set panel visibility when node is selected
    if (selectedNode) {
      setPanelVisible(true);
    }
  }, [selectedNode]);

  // Process releases into nodes
  const processNodes = useCallback((releases) => {
    // Group releases by their primary style
    const styleGroups = _.groupBy(releases, r => r.styles?.[0] || 'Unknown');
    
    // Create style cluster nodes
    const clusters = Object.entries(styleGroups).map(([style, items]) => ({
      id: `cluster-${style}`,
      name: style,
      type: 'cluster',
      size: Math.sqrt(items.length) * 2,
      color: NODE_COLORS.cluster[style] || NODE_COLORS.cluster.default,
      childCount: items.length,
      data: { type: 'cluster', style, count: items.length }
    }));

    // Create release nodes (limited to NODE_LIMIT for performance)
    const nodes = releases.slice(0, NODE_LIMIT).map(release => ({
      id: release.id,
      name: release.title,
      type: 'release',
      size: 3,
      color: NODE_COLORS.release,
      data: release
    }));

    console.log(`Created ${clusters.length} clusters and ${nodes.length} release nodes`);
    return [...clusters, ...nodes];
  }, []);

  // Process links between nodes
  const processLinks = useCallback((releases, nodes) => {
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
    let linkCount = 0;
    for (let i = 0; i < releases.length - 1 && linkCount < NODE_LIMIT * 2; i++) {
      if (releases[i].labelName === releases[i + 1].labelName) {
        if (nodeMap.has(releases[i].id) && nodeMap.has(releases[i + 1].id)) {
          links.push({
            source: releases[i].id,
            target: releases[i + 1].id,
            value: 1
          });
          linkCount++;
        }
      }
    }

    console.log(`Created ${links.length} links`);
    return links;
  }, []);

  // Filter nodes based on search term
  const filterNodes = useCallback((nodes, term) => {
    if (!term) return nodes;
    
    const lowerTerm = term.toLowerCase();
    return nodes.filter(node => 
      node.name.toLowerCase().includes(lowerTerm) ||
      node.data?.artistNames?.some(artist => artist.toLowerCase().includes(lowerTerm)) ||
      node.data?.labelName?.toLowerCase().includes(lowerTerm)
    );
  }, []);

  // Fetch releases data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching release data...');
      const response = await fetch('/api/releases/2008');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const releases = await response.json();
      console.log(`Fetched ${releases.length} releases`);
      
      // Process releases into nodes and links
      const nodes = processNodes(releases);
      const links = processLinks(releases, nodes);
      
      setOriginalData({ nodes, links });
      setData({ nodes, links });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [processNodes, processLinks]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data when search term changes
  useEffect(() => {
    if (searchTerm && originalData.nodes.length > 0) {
      const filteredNodes = filterNodes(originalData.nodes, searchTerm);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredLinks = originalData.links.filter(l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      });
      setData({ nodes: filteredNodes, links: filteredLinks });
    } else if (originalData.nodes.length > 0) {
      setData(originalData);
    }
  }, [searchTerm, originalData, filterNodes]);

  // Handle node click for selection/zoom
  const handleNodeClick = useCallback((node) => {
    console.log('Node clicked:', node); // Debug log
    
    if (!node || !graphRef.current) return;

    // Zoom to the node
    const distance = 50;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
    
    // Pause animation for smoother camera movement
    graphRef.current.pauseAnimation();
    
    graphRef.current.cameraPosition(
      { 
        x: node.x * distRatio, 
        y: node.y * distRatio, 
        z: node.z * distRatio 
      },
      node,
      2000
    );

    // Highlight the selected node
    setData(prevData => ({
      ...prevData,
      nodes: prevData.nodes.map(n => ({
        ...n,
        color: n.id === node.id ? NODE_COLORS.selected : 
               n.type === 'cluster' ? NODE_COLORS.cluster[n.name] || NODE_COLORS.cluster.default :
               NODE_COLORS.release
      }))
    }));

    // Set the node as selected (which will trigger the panel to show)
    setSelectedNode(node);
    setPanelVisible(true);
    
    // Resume animation after camera move completes
    setTimeout(() => {
      if (graphRef.current) {
        graphRef.current.resumeAnimation();
      }
    }, 2000);
  }, []);

  // Reset view to original camera position
  const resetView = useCallback(() => {
    if (!graphRef.current) return;
    
    graphRef.current.cameraPosition(
      { x: 0, y: 0, z: 300 },
      { x: 0, y: 0, z: 0 },
      2000
    );
    
    setSelectedNode(null);
    setPanelVisible(false);
  }, []);

  // Handle zoom in/out
  const handleZoom = useCallback((factor) => {
    if (!graphRef.current) return;
    
    const { x, y, z } = graphRef.current.cameraPosition();
    graphRef.current.cameraPosition(
      { x: x * factor, y: y * factor, z: z * factor },
      { x: 0, y: 0, z: 0 },
      1000
    );
  }, []);

  // Handle closing the panel
  const closePanel = useCallback(() => {
    setSelectedNode(null);
    setPanelVisible(false);
  }, []);

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <Card className="p-6 bg-black/80 backdrop-blur-sm text-white border-red-500">
          <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Visualization</h3>
          <p>{error}</p>
          <Button onClick={fetchData} className="mt-4">Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-50 flex flex-col gap-4">
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={resetView}
            className="bg-black/50 text-white hover:bg-black/70">
            <Home className="w-4 h-4 mr-2" />
            Reset View
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleZoom(0.8)}
              className="bg-black/50 text-white hover:bg-black/70">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleZoom(1.2)}
              className="bg-black/50 text-white hover:bg-black/70">
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
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

      {/* Force Graph */}
      {loading ? (
        <div className="w-full h-screen flex items-center justify-center bg-black/80">
          <div className="text-white text-xl">Loading visualization...</div>
        </div>
      ) : (
        <div className="w-full h-screen">
          <ForceGraph3D
            ref={graphRef}
            graphData={data}
            nodeLabel={node => `${node.name} ${node.type === 'cluster' ? `(${node.childCount} releases)` : ''}`}
            backgroundColor="#000000"
            nodeRelSize={8}
            nodeResolution={16}
            linkDirectionalParticles={3}
            linkDirectionalParticleSpeed={0.005}
            linkWidth={0.5}
            linkOpacity={0.2}
            onNodeClick={handleNodeClick}
            onNodeHover={(node, prevNode) => {
              setHoveredNode(node);
              if (node) {
                document.body.style.cursor = 'pointer';
              } else {
                document.body.style.cursor = 'default';
              }
            }}
            enableNodeDrag={false}
            enableNavigationControls={true}
            controlType="orbit"
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            warmupTicks={100}
            cooldownTicks={50}
            cooldownTime={2000}
          />
        </div>
      )}

      {/* Fixed Panel Implementation that's always in the DOM */}
      <div
        className="fixed top-4 right-4 p-4 w-96 bg-black/90 backdrop-blur-lg text-white border border-white/20 rounded-md shadow-lg shadow-blue-900/30 z-50"
        style={{ 
          display: panelVisible && selectedNode ? 'block' : 'none',
          pointerEvents: 'auto'
        }}
      >
        {selectedNode && (
          <>
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={closePanel}
                className="h-6 w-6 p-0 rounded-full hover:bg-white/20"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            
            <div className="space-y-3 mt-2">
              {selectedNode.type === 'cluster' ? (
                <>
                  <div className="bg-blue-900/30 p-2 rounded-md">
                    <p className="text-sm text-blue-300 mb-1">Style Cluster</p>
                    <p className="font-medium">Contains {selectedNode.childCount} releases</p>
                  </div>
                  {selectedNode.data?.style && (
                    <p>Primary style: <span className="font-semibold">{selectedNode.data.style}</span></p>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-purple-900/30 p-2 rounded-md">
                    <p className="text-sm text-purple-300 mb-1">Release</p>
                    <p className="font-medium">{selectedNode.data?.year || '2008'}</p>
                  </div>
                  
                  {selectedNode.data?.artistNames && selectedNode.data.artistNames.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Artists</p>
                      <p className="font-medium">{selectedNode.data.artistNames.join(', ')}</p>
                    </div>
                  )}
                  
                  {selectedNode.data?.labelName && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Label</p>
                      <p className="font-medium">{selectedNode.data.labelName}</p>
                    </div>
                  )}
                  
                  {selectedNode.data?.styles && selectedNode.data.styles.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Styles</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.data.styles.map(style => (
                          <span key={style} className="bg-white/10 px-2 py-1 rounded-md text-xs">
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Simple Debug Panel (uncomment if you need to debug) */}
      {/* 
      <div className="fixed bottom-4 left-4 p-4 bg-red-500 text-white z-50 max-w-md">
        selectedNode: {selectedNode ? selectedNode.name : 'none'} | 
        panelVisible: {panelVisible ? 'true' : 'false'}
      </div>
      */}
    </div>
  );
};

export default GraphVisualization;