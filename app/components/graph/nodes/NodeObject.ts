// app/components/graph/nodes/NodeObject.ts
'use client';

import * as THREE from 'three';
import { GraphNode } from '@/lib/types/graph';

export const createNodeObject = (node: GraphNode) => {
  // Créer un matériau pour le nœud
  const material = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(
      (() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 256;
        canvas.height = 128;
        
        // Fond semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texte
        ctx.fillStyle = '#ffffff'; // Utiliser du blanc pour le texte
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name, canvas.width / 2, canvas.height / 2);
        
        return canvas;
      })()
    )
  });

  const sprite = new THREE.Sprite(material);
  
  // Ajuster la taille du sprite en fonction du paramètre size du noeud
  const scale = ((node.size || 10) / 10) * 5;
  sprite.scale.set(scale, scale / 2, 1);
  
  return sprite;
};