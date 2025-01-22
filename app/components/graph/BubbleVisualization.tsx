'use client';

import React, { useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';

const STYLE_COLORS = {
  'House': '#FF4081',
  'Deep House': '#C2185B',
  'Tech House': '#00BCD4',
  'Techno': '#2196F3',
  'Minimal': '#1976D2',
  'Ambient': '#4CAF50',
  'Experimental': '#1B5E20',
  'Abstract': '#81C784',
  'IDM': '#9C27B0',
  'default': '#9E9E9E'
};

const BubbleVisualization = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/releases');
        const releases = await response.json();
        
        const labelGroups = releases.reduce((acc, release) => {
          if (release.labelName) {
            acc[release.labelName] = (acc[release.labelName] || []).concat(release);
          }
          return acc;
        }, {});
        
        const nodes = [];
        const links = [];
        
        Object.entries(labelGroups).forEach(([label, releases]) => {
          nodes.push({
            id: `label-${label}`,
            name: label,
            type: 'label',
            val: Math.min(30, releases.length),
            color: '#FFD700'
          });
        });

        releases.forEach(release => {
          nodes.push({
            id: release.id,
            name: release.title,
            type: 'release',
            val: 15,
            color: release.styles?.[0] ? STYLE_COLORS[release.styles[0]] || STYLE_COLORS.default : STYLE_COLORS.default,
            year: release.year,
            artists: release.artistNames.join(', '),
            styles: release.styles?.join(', '),
            label: release.labelName
          });

          if (release.labelName) {
            links.push({
              source: release.id,
              target: `label-${release.labelName}`,
              value: 1
            });
          }
        });

        setGraphData({ nodes, links });
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading releases...</div>;
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <ForceGraph3D
        graphData={graphData}
        nodeLabel="name"
        nodeColor={node => node.color}
        nodeVal={node => node.val}
        linkWidth={link => link.value}
        linkOpacity={0.2}
        backgroundColor="#000000"
        onNodeClick={setSelectedNode}
        nodeThreeObject={node => {
          const group = new THREE.Group();

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
            {selectedNode.type === 'release' && (
              <>
                <p><span className="text-gray-400">Artists:</span> {selectedNode.artists}</p>
                <p><span className="text-gray-400">Year:</span> {selectedNode.year}</p>
                <p><span className="text-gray-400">Label:</span> {selectedNode.label}</p>
                <p><span className="text-gray-400">Styles:</span> {selectedNode.styles}</p>
              </>
            )}
            {selectedNode.type === 'label' && (
              <p><span className="text-gray-400">Type:</span> Record Label</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BubbleVisualization;