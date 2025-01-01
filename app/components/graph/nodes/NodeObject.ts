import * as THREE from 'three';
import { GraphNode } from '@/lib/types/graph';

export const createNodeObject = (node: GraphNode) => {
  // Create canvas for text rendering
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return null;

  // Set canvas size
  canvas.width = 256;
  canvas.height = 128;

  // Draw text
  context.fillStyle = 'rgba(0, 0, 0, 0.2)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = '24px Arial';
  context.fillStyle = node.color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(node.name, canvas.width / 2, canvas.height / 2);

  // Create sprite
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  
  // Scale sprite
  sprite.scale.set(12, 6, 1);
  
  return sprite;
};