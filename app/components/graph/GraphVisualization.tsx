import { useRef, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useGraphStore } from '@/lib/store/graphStore';
import { createNodeObject, graphConfig } from './nodes/NodeObject';
import { useGraphInitialization } from './hooks/useGraphInitialization';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

export default function GraphVisualization() {
  const graphRef = useRef();
  const { nodes, links, setSelectedNode } = useGraphStore();
  
  useGraphInitialization();

  useEffect(() => {
    if (graphRef.current) {
      const fg = graphRef.current;
      const scene = fg.scene();
      const renderer = fg.renderer();
      const camera = fg.camera();

      // Éclairage
      scene.remove(...scene.children.filter(child => child instanceof THREE.Light));
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);
      
      const pointLight1 = new THREE.PointLight(0xffffff, 1, 1000);
      pointLight1.position.set(100, 100, 100);
      scene.add(pointLight1);
      
      const pointLight2 = new THREE.PointLight(0xffffff, 1, 1000);
      pointLight2.position.set(-100, -100, -100);
      scene.add(pointLight2);

      // Post-processing pour l'effet de bloom
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,   // Force
        0.4,   // Rayon
        0.85   // Seuil
      );

      composer.addPass(renderPass);
      composer.addPass(bloomPass);

      // Remplacer le rendu standard par notre version avec post-processing
      const animate = () => {
        requestAnimationFrame(animate);
        composer.render();
      };
      animate();
    }
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-radial from-background via-background to-background/80">
      <ForceGraph3D
        ref={graphRef}
        graphData={{ nodes, links }}
        nodeLabel="name"
        backgroundColor="rgba(0,0,0,0)"
        nodeThreeObject={createNodeObject}
        nodeThreeObjectExtend={false}
        linkColor={() => 'rgba(255,255,255,0.1)'}
        linkWidth={1}
        linkOpacity={0.2}
        onNodeClick={(node) => setSelectedNode(node)}
        d3Force={graphConfig.d3Force}
        controlType="orbit"
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
      />
    </div>
  );
}