// GraphVisualization.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, ZoomIn, ZoomOut, Search } from 'lucide-react';
import { debounce } from 'lodash';

const ForceGraph = dynamic(() => import('./ForceGraph'), { ssr: false });
const worker = new Worker(new URL('./graphWorker.js', import.meta.url), { type: 'module' });

const NODE_TYPES = {
 RELEASE: 'release',
 ARTIST: 'artist',
 LABEL: 'label',
 CLUSTER: 'cluster'
};

const NODE_COLORS = {
 [NODE_TYPES.RELEASE]: '#4CAF50',
 [NODE_TYPES.ARTIST]: '#2196F3',
 [NODE_TYPES.LABEL]: '#FF4081',
 [NODE_TYPES.CLUSTER]: '#FFD700',
 selected: '#FFD700'
};

const BATCH_SIZE = 1000;
const VISIBLE_RADIUS = 100;

export default function GraphVisualization() {
 const graphRef = useRef();
 const [loading, setLoading] = useState(true);
 const [currentChunk, setCurrentChunk] = useState(0);
 const [graphData, setGraphData] = useState({ nodes: [], links: [] });
 const [selectedNode, setSelectedNode] = useState(null);
 const [rawData, setRawData] = useState(null);
 const [loadedNodes, setLoadedNodes] = useState(new Set());

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
     const newNodes = nodes.filter(n => !loadedNodes.has(n.id));
     
     setLoadedNodes(prev => new Set([...prev, ...newNodes.map(n => n.id)]));
     setGraphData(prev => ({
       nodes: [...prev.nodes, ...newNodes],
       links: [...prev.links, ...links]
     }));
   };

   return () => worker.terminate();
 }, [loadedNodes]);

 useEffect(() => {
   const fetchData = async () => {
     try {
       const response = await fetch('/api/releases/2008');
       const releases = await response.json();
       setRawData(releases);

       worker.postMessage({
         type: 'INIT',
         data: releases.slice(0, BATCH_SIZE)
       });

       setCurrentChunk(1);
       setLoading(false);
     } catch (error) {
       console.error(error);
       setLoading(false);
     }
   };

   fetchData();
 }, []);

 // Node rendering
 const nodeThreeObject = useCallback((node) => {
   const geometry = new THREE.SphereGeometry(node.val || 5);
   const material = materialsCache[
     selectedNode?.id === node.id ? 'selected' : 
     node.cluster ? NODE_TYPES.CLUSTER : node.type
   ].clone();
   return new THREE.Mesh(geometry, material);
 }, [selectedNode, materialsCache]);

 // Load chunks
 useEffect(() => {
   if (!rawData || currentChunk * BATCH_SIZE >= rawData.length) return;

   const timeoutId = setTimeout(() => {
     worker.postMessage({
       type: 'LOAD_CHUNK',
       data: {
         start: currentChunk * BATCH_SIZE,
         size: BATCH_SIZE
       }
     });
     setCurrentChunk(prev => prev + 1);
   }, 1000);

   return () => clearTimeout(timeoutId);
 }, [currentChunk, rawData]);

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

   worker.postMessage({
     type: node.cluster ? 'EXPAND_CLUSTER' : 'LOAD_CONNECTED',
     nodeId: node.id
   });
 }, []);

 const handleCameraMove = useCallback(debounce((position) => {
   worker.postMessage({
     type: 'UPDATE_VISIBLE',
     center: position,
     radius: VISIBLE_RADIUS
   });
 }, 100), []);

 const handleSearch = useCallback(debounce((term) => {
   worker.postMessage({
     type: 'SEARCH',
     term,
     data: rawData
   });
 }, 300), [rawData]);

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
       width={window.innerWidth}
       height={window.innerHeight}
       linkWidth={2}
       linkOpacity={0.2}
       linkColor={() => '#ffffff'}
       onNodeClick={handleNodeClick}
       onCameraPositionChange={handleCameraMove}
       d3Force={(d3Force) => {
         d3Force.force('charge')?.strength(-200);
         d3Force.force('link')?.distance(50);
         d3Force.force('center')?.strength(0.05);
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
           ) : selectedNode.type === NODE_TYPES.LABEL ? (
             <>
               <p>Label</p>
               <p>Releases: {selectedNode.releaseCount}</p>
             </>
           ) : (
             <>
               <p>Cluster</p>
               <p>Contains {selectedNode.nodes?.length || 0} items</p>
             </>
           )}
         </div>
       </Card>
     )}
   </div>
 );
}