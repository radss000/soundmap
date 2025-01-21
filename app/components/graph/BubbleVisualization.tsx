import React, { useEffect, useState, useCallback } from 'react';
import { ForceGraph3D } from 'react-force-graph-3d';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';

// Style categories and their colors
const STYLE_CATEGORIES = {
  // Main Electronic Styles
  'House': '#FF4081',
  'Deep House': '#C2185B',
  'Garage House': '#880E4F',
  'Tech House': '#F06292',
  'Acid House': '#FF80AB',
  'Progressive House': '#AD1457',
  'Tribal House': '#EC407A',
  'Hard House': '#D81B60',
  'Euro House': '#F48FB1',
  'Italo House': '#FCE4EC',

  // Techno Variants
  'Techno': '#2196F3',
  'Minimal Techno': '#1976D2',
  'Dub Techno': '#0D47A1',
  'Industrial': '#64B5F6',

  // Ambient & Experimental
  'Ambient': '#4CAF50',
  'Dark Ambient': '#2E7D32',
  'Experimental': '#1B5E20',
  'Abstract': '#81C784',
  'Drone': '#388E3C',
  'IDM': '#66BB6A',
  'Glitch': '#A5D6A7',

  // Bass Music
  'Drum n Bass': '#9C27B0',
  'Dubstep': '#7B1FA2',
  'Jungle': '#6A1B9A',
  'Bass Music': '#BA68C8',
  'Breakbeat': '#AB47BC',
  'Breaks': '#8E24AA',
  'Big Beat': '#E1BEE7',

  // Dance Styles
  'Trance': '#FF9800',
  'Psy-Trance': '#F57C00',
  'Goa Trance': '#EF6C00',
  'Hard Trance': '#E65100',
  'Progressive Trance': '#FFA726',
  
  // Other Electronic
  'Electro': '#00BCD4',
  'Synth-pop': '#0097A7',
  'New Wave': '#00838F',
  'EBM': '#4DD0E1',
  'Future Jazz': '#26C6DA',
  'Downtempo': '#00ACC1',
  'Trip Hop': '#80DEEA',
  
  // Default for uncategorized styles
  'default': '#9E9E9E'
};

const BubbleVisualization = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await window.fs.readFile('/Users/admin/Desktop/db_soundmap/electronic_releases_2008.json', { encoding: 'utf8' });
        const data = JSON.parse(response);
        
        // Transform the data into graph format
        const nodes = data.releases.map(release => ({
          id: release.id,
          name: release.title,
          val: calculateNodeSize(release), // Size based on significance
          color: getStyleColor(release.styles),
          year: release.year,
          artists: release.artists?.map(a => a.name).join(', '),
          styles: release.styles?.join(', '),
          genre: release.genres?.join(', '),
          label: release.labels?.[0]?.name
        }));

        // Create links based on shared styles and labels
        const links = createLinks(data.releases);

        setGraphData({ nodes, links });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const calculateNodeSize = (release) => {
    let size = 1;
    // Increase size based on various factors
    if (release.styles?.length > 0) size += release.styles.length * 0.2;
    if (release.artists?.length > 0) size += release.artists.length * 0.3;
    if (release.tracklist?.length > 0) size += Math.log(release.tracklist.length) * 0.5;
    return size;
  };

  const getStyleColor = (styles) => {
    if (!styles || styles.length === 0) return STYLE_CATEGORIES.default;
    
    // Try to find the first style that has a defined color
    const matchedStyle = styles.find(style => STYLE_CATEGORIES[style]);
    return matchedStyle ? STYLE_CATEGORIES[matchedStyle] : STYLE_CATEGORIES.default;
  };

  const createLinks = (releases) => {
    const links = [];
    for (let i = 0; i < releases.length; i++) {
      for (let j = i + 1; j < Math.min(releases.length, i + 20); j++) {
        if (haveCommonStyles(releases[i], releases[j]) || 
            haveCommonLabel(releases[i], releases[j])) {
          links.push({
            source: releases[i].id,
            target: releases[j].id,
            value: calculateLinkStrength(releases[i], releases[j])
          });
        }
      }
    }
    return links;
  };

  const haveCommonStyles = (release1, release2) => {
    if (!release1.styles || !release2.styles) return false;
    return release1.styles.some(style => release2.styles.includes(style));
  };

  const haveCommonLabel = (release1, release2) => {
    if (!release1.labels?.[0] || !release2.labels?.[0]) return false;
    return release1.labels[0].name === release2.labels[0].name;
  };

  const calculateLinkStrength = (release1, release2) => {
    let strength = 1;
    if (haveCommonStyles(release1, release2)) strength += 1;
    if (haveCommonLabel(release1, release2)) strength += 2;
    return strength;
  };

  const handleNodeClick = useCallback(node => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="relative w-full h-screen bg-background">
      <ForceGraph3D
        graphData={graphData}
        nodeLabel="name"
        nodeColor={node => node.color}
        nodeVal={node => node.val}
        linkWidth={link => link.value * 0.5}
        linkOpacity={0.2}
        backgroundColor="#00000000"
        onNodeClick={handleNodeClick}
        onNodeHover={setHoveredNode}
        nodeThreeObject={node => {
          const group = new THREE.Group();

          // Main sphere
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(node.val),
            new THREE.MeshPhongMaterial({
              color: node.color,
              transparent: true,
              opacity: 0.7,
              depthWrite: true,
              shininess: 50
            })
          );
          
          // Glow effect
          const glowSphere = new THREE.Mesh(
            new THREE.SphereGeometry(node.val * 1.2),
            new THREE.MeshPhongMaterial({
              color: node.color,
              transparent: true,
              opacity: 0.3,
              depthWrite: false
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
        <Card className="absolute top-4 right-4 p-4 w-80 bg-background/80 backdrop-blur-sm">
          <h3 className="font-bold">{selectedNode.name}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Artists: {selectedNode.artists}<br/>
            Year: {selectedNode.year}<br/>
            Label: {selectedNode.label}<br/>
            Styles: {selectedNode.styles}<br/>
            Genre: {selectedNode.genre}
          </p>
        </Card>
      )}
    </div>
  );
};

export default BubbleVisualization;