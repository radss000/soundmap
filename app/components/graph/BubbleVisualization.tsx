'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { SlidersHorizontal } from 'lucide-react';

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
 const graphRef = useRef();
 const [rawData, setRawData] = useState({ nodes: [], links: [] });
 const [graphData, setGraphData] = useState({ nodes: [], links: [] });
 const [selectedNode, setSelectedNode] = useState(null);
 const [loading, setLoading] = useState(true);
 const [viewDistance, setViewDistance] = useState(1000);
 const [filters, setFilters] = useState({
   search: '',
   label: null,
   styles: []
 });
 const [uniqueLabels, setUniqueLabels] = useState([]);
 const [uniqueStyles, setUniqueStyles] = useState([]);

 const handleNodeClick = useCallback(node => {
   const distance = 40;
   const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
   graphRef.current.cameraPosition(
     { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
     node,
     2000
   );
   setSelectedNode(node);
 }, []);

 // Fetch initial data
 useEffect(() => {
   const fetchData = async () => {
     try {
       const response = await fetch('/api/releases');
       const releases = await response.json();
       
       const labels = new Set();
       const styles = new Set();
       
       const labelGroups = releases.reduce((acc, release) => {
         if (release.labelName) {
           acc[release.labelName] = (acc[release.labelName] || []).concat(release);
           labels.add(release.labelName);
         }
         release.styles?.forEach(style => styles.add(style));
         return acc;
       }, {});
       
       setUniqueLabels(Array.from(labels));
       setUniqueStyles(Array.from(styles));
       
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

       setRawData({ nodes, links });
       setGraphData({ nodes, links });
       setLoading(false);
     } catch (error) {
       console.error('Error loading data:', error);
       setLoading(false);
     }
   };

   fetchData();
 }, []);

 // Apply filters when they change
 useEffect(() => {
   if (!rawData.nodes.length) return;
   
   const filteredNodes = rawData.nodes.filter(node => {
     if (node.type === 'label') return true;
     if (filters.search && !node.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
     if (filters.label && node.label !== filters.label) return false;
     if (filters.styles.length && !node.styles?.some(s => filters.styles.includes(s))) return false;
     return true;
   });

   const filteredLinks = rawData.links.filter(link => 
     filteredNodes.find(n => n.id === link.source || n.id === link.target)
   );

   setGraphData({ nodes: filteredNodes, links: filteredLinks });
 }, [filters, rawData]);

 return (
   <div className="relative w-full h-screen bg-black">
     <div className="absolute top-4 left-4 z-10 flex gap-4 bg-black/50 p-4 rounded-lg">
       <Input
         placeholder="Search releases..."
         value={filters.search}
         onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
         className="w-64 text-white"
       />
       
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button variant="outline">
             <SlidersHorizontal className="mr-2 h-4 w-4" />
             Filters
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="start" className="w-56">
           <Select
             value={filters.label || ''}
             onValueChange={(value) => setFilters(prev => ({ ...prev, label: value || null }))}
           >
             <option value="">All Labels</option>
             {uniqueLabels.map(label => (
               <option key={label} value={label}>{label}</option>
             ))}
           </Select>
           {uniqueStyles.map(style => (
             <DropdownMenuCheckboxItem
               key={style}
               checked={filters.styles.includes(style)}
               onCheckedChange={(checked) => {
                 setFilters(prev => ({
                   ...prev,
                   styles: checked 
                     ? [...prev.styles, style]
                     : prev.styles.filter(s => s !== style)
                 }));
               }}
             >
               {style}
             </DropdownMenuCheckboxItem>
           ))}
         </DropdownMenuContent>
       </DropdownMenu>
     </div>

     {loading ? (
       <div className="flex items-center justify-center h-screen">Loading releases...</div>
     ) : (
       <ForceGraph3D
         ref={graphRef}
         graphData={graphData}
         nodeLabel={node => node.name}
         nodeColor={node => node.color}
         nodeRelSize={node => node.val}
         nodeResolution={16}
         linkWidth={1}
         linkOpacity={0.2}
         backgroundColor="#000000"
         showNavInfo={false}
         onNodeClick={handleNodeClick}
         onNodeRightClick={node => {
           graphRef.current.cameraPosition(
             { x: 0, y: 0, z: viewDistance },
             { x: 0, y: 0, z: 0 },
             2000
           );
           setSelectedNode(null);
         }}
         nodeThreeObject={node => {
           if (node.type !== 'label') return null;
           
           const sprite = new THREE.Sprite(
             new THREE.SpriteMaterial({
               map: new THREE.TextureLoader().load('/cluster-glow.png'),
               color: node.color,
               transparent: true,
               opacity: 0.8,
               blending: THREE.AdditiveBlending
             })
           );
           sprite.scale.set(40, 40, 1);
           return sprite;
         }}
       />
     )}
     
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