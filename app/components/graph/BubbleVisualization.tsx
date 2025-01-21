'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';
import _ from 'lodash';

// Function to generate color variants
const generateSubGenreColors = (baseColor: string, count: number) => {
  const colors: string[] = [];
  for(let i = 0; i < count; i++) {
    colors.push(baseColor + (Math.floor(Math.random() * 50) + 25));
  }
  return colors;
};

// Style categories and their colors
const STYLE_CATEGORIES = {
  'House': generateSubGenreColors('#FF2D55', 8),
  'Techno': generateSubGenreColors('#2196F3', 6),
  'Ambient': generateSubGenreColors('#4CAF50', 4),
  'Trance': generateSubGenreColors('#FF9800', 5),
  'Drum n Bass': generateSubGenreColors('#9C27B0', 3),
  'Experimental': generateSubGenreColors('#795548', 5),
  'Breaks': generateSubGenreColors('#607D8B', 4),
  'Electro': generateSubGenreColors('#00BCD4', 3),
  'default': ['#9E9E9E']
};

const BubbleVisualization = () => {
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await window.fs.readFile('/Users/admin/Desktop/db_soundmap/electronic_releases_2008.json', { encoding: 'utf8' });
        const data = JSON.parse(response);
        
        // Process and transform the data
        const processedNodes = processReleases(data.releases);
        const processedLinks = createLinks(processedNodes);
        
        setGraphData({
          nodes: processedNodes,
          links: processedLinks
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const processReleases = (releases: any[]) => {
    return releases.map(release => ({
      id: release.id,
      name: release.title,
      val: calculateNodeSize(release),
      color: getStyleColor(release.styles),
      year: release.year,
      artists: release.artists?.map((a: any) => a.name).join(', '),
      styles: release.styles?.join(', '),
      genre: release.genres?.join(', '),
      label: release.labels?.[0]?.name,
      // Store original data for clustering
      styleList: release.styles || [],
      labelName: release.labels?.[0]?.name
    }));
  };

  const calculateNodeSize = (release: any) => {
    let size = 2; // Base size
    if (release.styles?.length) size += Math.min(release.styles.length * 0.5, 2);
    if (release.artists?.length) size += Math.min(release.artists.length * 0.3, 1);
    if (release.tracklist?.length) size += Math.log(release.tracklist.length) * 0.2;
    return size;
  };

  const getStyleColor = (styles: string[]) => {
    if (!styles || styles.length === 0) return STYLE_CATEGORIES.default[0];
    
    // Find the main category that matches any of the styles
    for (const [category, colors] of Object.entries(STYLE_CATEGORIES)) {
      if (styles.some(style => style.includes(category))) {
        return colors[Math.floor(Math.random() * colors.length)];
      }
    }
    
    return STYLE_CATEGORIES.default[0];
  };

  const createLinks = (nodes: any[]) => {
    const links: any[] = [];
    const processed = new Set();

    nodes.forEach((node1, i) => {
      nodes.slice(i + 1).forEach(node2 => {
        const linkId = \`\${node1.id}-\${node2.id}\`;
        if (!processed.has(linkId)) {
          const strength = calculateLinkStrength(node1, node2);
          if (strength > 0) {
            links.push({
              source: node1.id,
              target: node2.id,
              value: strength
            });
          }
          processed.add(linkId);
        }
      });
    });

    return links;
  };

  const calculateLinkStrength = (node1: any, node2: any) => {
    let strength = 0;
    
    // Check for shared styles
    const sharedStyles = node1.styleList.filter((style: string) => 
      node2.styleList.includes(style)
    ).length;
    strength += sharedStyles * 0.5;

    // Check for same label
    if (node1.labelName && node2.labelName && node1.labelName === node2.labelName) {
      strength += 1;
    }

    // Only create link if there's enough similarity
    return strength > 0.5 ? strength : 0;
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-black to-gray-900">
      <ForceGraph3D
        graphData={graphData}
        nodeLabel="name"
        nodeColor={node => node.color}
        nodeVal={node => node.val}
        linkWidth={link => link.value * 0.5}
        linkOpacity={0.2}
        backgroundColor="#000000"
        onNodeClick={handleNodeClick}
        nodeThreeObject={node => {
          const group = new THREE.Group();

          // Main sphere
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(node.val, 32, 32),
            new THREE.MeshPhysicalMaterial({
              color: node.color,
              transparent: true,
              opacity: 0.7,
              metalness: 0.5,
              roughness: 0.2,
              emissive: new THREE.Color(node.color).multiplyScalar(0.2)
            })
          );
          
          // Glow effect
          const glowSphere = new THREE.Mesh(
            new THREE.SphereGeometry(node.val * 1.2, 32, 32),
            new THREE.MeshPhysicalMaterial({
              color: node.color,
              transparent: true,
              opacity: 0.15,
              metalness: 1,
              roughness: 0
            })
          );

          group.add(sphere);
          group.add(glowSphere);
          
          return group;
        }}
        cooldownTicks={100}
        d3VelocityDecay={0.3}
      />
      
      {selectedNode && (
        <Card className="absolute top-4 right-4 p-4 w-96 bg-black/80 backdrop-blur-md border-gray-800 text-white">
          <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-400">Artists:</span> {selectedNode.artists}</p>
            <p><span className="text-gray-400">Year:</span> {selectedNode.year}</p>
            <p><span className="text-gray-400">Label:</span> {selectedNode.label}</p>
            <p><span className="text-gray-400">Styles:</span> {selectedNode.styles}</p>
            <p><span className="text-gray-400">Genre:</span> {selectedNode.genre}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BubbleVisualization;