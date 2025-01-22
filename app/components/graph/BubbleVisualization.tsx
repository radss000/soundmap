'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';

// Style categories with their colors
const STYLE_COLORS = {
  'House': '#FF4081',
  'Deep House': '#C2185B',
  'Tech House': '#00BCD4',
  'Techno': '#2196F3',
  'Minimal': '#1976D2',
  'Ambient': '#4CAF50',
  'Experimental': '#1B5E20',
  'Abstract': '#81C784',
  'Drum n Bass': '#9C27B0',
  'Breakbeat': '#7B1FA2',
  'Breaks': '#6A1B9A',
  'Trance': '#FF9800',
  'Electro': '#00BCD4',
  'Future Jazz': '#26C6DA',
  'Downtempo': '#00ACC1',
  'Trip Hop': '#80DEEA',
  'default': '#9E9E9E'
};

const BubbleVisualization = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Use the static data for now
        const sampleReleases = [
          {
            "id": "2",
            "title": "Knockin' Boots Vol. 2 Of 2",
            "artists": [{"name": "Mr. James Barth & A.D."}],
            "year": 1998,
            "country": "Sweden",
            "labels": [{"name": "Svek", "catno": "SK026"}],
            "genres": ["Electronic"],
            "styles": ["Techno", "Tech House"]
          },
          // Add more releases from your data here
        ];

        // Transform releases into nodes
        const nodes = sampleReleases.map(release => ({
          id: release.id,
          name: release.title,
          val: calculateNodeSize(release),
          color: getStyleColor(release.styles),
          year: release.year,
          artists: release.artists?.map(a => a.name).join(', '),
          styles: release.styles?.join(', '),
          genres: release.genres?.join(', '),
          label: release.labels?.[0]?.name,
          styleList: release.styles || [],
          country: release.country
        }));

        // Create links between nodes that share styles or labels
        const links = createLinks(nodes);

        setGraphData({ nodes, links });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Rest of the component remains the same...
  // (Node sizing, color selection, link creation, etc.)

  return (
    <div className="relative w-full h-screen bg-black">
      <ForceGraph3D
        graphData={graphData}
        nodeLabel="name"
        nodeColor={node => node.color}
        nodeVal={node => node.val}
        linkWidth={1}
        linkOpacity={0.2}
        backgroundColor="#000000"
        onNodeClick={setSelectedNode}
        nodeThreeObject={node => {
          const group = new THREE.Group();

          // Main sphere
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(node.val, 32, 32),
            new THREE.MeshPhongMaterial({
              color: node.color,
              transparent: true,
              opacity: 0.75,
              metalness: 0.3,
              roughness: 0.2,
              emissive: new THREE.Color(node.color).multiplyScalar(0.2)
            })
          );
          
          // Glow effect
          const glowSphere = new THREE.Mesh(
            new THREE.SphereGeometry(node.val * 1.2, 32, 32),
            new THREE.MeshPhongMaterial({
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
        d3AlphaMin={0.001}
      />
      
      {selectedNode && (
        <Card className="absolute top-4 right-4 p-4 w-96 bg-black/80 backdrop-blur-sm text-white border-gray-800">
          <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-400">Artists:</span> {selectedNode.artists}</p>
            <p><span className="text-gray-400">Year:</span> {selectedNode.year}</p>
            <p><span className="text-gray-400">Label:</span> {selectedNode.label}</p>
            <p><span className="text-gray-400">Styles:</span> {selectedNode.styles}</p>
            <p><span className="text-gray-400">Genres:</span> {selectedNode.genres}</p>
            {selectedNode.country && (
              <p><span className="text-gray-400">Country:</span> {selectedNode.country}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BubbleVisualization;