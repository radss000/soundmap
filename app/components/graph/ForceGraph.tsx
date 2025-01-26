// ForceGraph.tsx
'use client';

import React, { useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

interface ForceGraphProps {
 graphData: {
   nodes: any[];
   links: any[];
 };
 ref?: React.ForwardedRef<any>;
 onNodeClick?: (node: any) => void;
 onCameraPositionChange?: (pos: any) => void;
 nodeThreeObject?: (node: any) => THREE.Object3D;
 [key: string]: any;
}

const ForceGraph = React.forwardRef<any, ForceGraphProps>((props, ref) => {
 const {
   graphData,
   nodeThreeObject,
   onNodeClick,
   onCameraPositionChange,
   ...rest
 } = props;

 const defaultNodeObject = useCallback((node: any) => {
   const geometry = new THREE.SphereGeometry(node.val || 5);
   const material = new THREE.MeshPhongMaterial({
     color: node.color || '#ffffff',
     transparent: true,
     opacity: 0.75
   });
   return new THREE.Mesh(geometry, material);
 }, []);

 return (
   <ForceGraph3D
     ref={ref}
     graphData={graphData}
     nodeThreeObject={nodeThreeObject || defaultNodeObject}
     nodeLabel="name"
     backgroundColor="#000000"
     width={window.innerWidth}
     height={window.innerHeight}
     linkWidth={2}
     linkOpacity={0.2}
     linkColor={() => '#ffffff'}
     onNodeClick={onNodeClick}
     onCameraPositionChange={onCameraPositionChange}
     d3Force={(d3Force) => {
       d3Force.force('charge')?.strength(-200);
       d3Force.force('link')?.distance(50);
       d3Force.force('center')?.strength(0.05);
     }}
     {...rest}
   />
 );
});

ForceGraph.displayName = 'ForceGraph';

export default ForceGraph;