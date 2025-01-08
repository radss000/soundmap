import * as THREE from 'three';
import { GraphNode } from '@/lib/types/graph';

export const createNodeObject = (node: GraphNode) => {
  // Créer une sphère 3D avec plus de segments pour plus de fluidité
  const geometry = new THREE.SphereGeometry(1, 64, 64);
  
  // Premier matériau pour l'effet de "glow" intérieur
  const innerMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(node.color),
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    metalness: 0.9,
    transmission: 0.8,
    thickness: 0.5
  });

  // Second matériau pour l'effet de surface brillante
  const outerMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(node.color),
    transparent: true,
    opacity: 0.2,
    roughness: 0,
    metalness: 1,
    transmission: 0.9,
    thickness: 0.05
  });

  // Créer deux sphères imbriquées
  const innerSphere = new THREE.Mesh(geometry, innerMaterial);
  const outerSphere = new THREE.Mesh(geometry.clone(), outerMaterial);
  outerSphere.scale.multiplyScalar(1.05); // Légèrement plus grande

  // Groupe pour les sphères
  const sphereGroup = new THREE.Group();
  sphereGroup.add(innerSphere);
  sphereGroup.add(outerSphere);

  // Créer le texte avec un sprite pour qu'il face toujours la caméra
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;

  if (context) {
    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'rgba(255,255,255,0.8)';
    context.fillText(node.name, canvas.width / 2, canvas.height / 2);
  }

  const labelTexture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: labelTexture,
    transparent: true,
    opacity: 0.8
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.y = 1.5;
  sprite.scale.set(2, 0.5, 1);

  // Groupe final
  const group = new THREE.Group();
  group.add(sphereGroup);
  group.add(sprite);

  // Échelle adaptée au type de nœud
  const baseScale = ((node.size || 10) / 10);
  const scale = node.type === 'artist' ? baseScale * 2.5 :
                node.type === 'label' ? baseScale * 2 :
                baseScale * 1.5;
  
  group.scale.set(scale, scale, scale);

  return group;
};

// Configuration des forces pour un meilleur layout
export const graphConfig = {
  d3Force: (d3: any) => {
    // Force de répulsion plus forte pour plus d'espacement
    d3.force('charge')?.strength(-200);
    
    // Distance des liens plus courte pour des clusters plus denses
    d3.force('link')?.distance(20);
    
    // Force centrale plus faible pour permettre plus de dispersion
    d3.force('center')?.strength(0.2);
    
    // Force de collision plus forte et rayon plus grand
    d3.force('collide')
      ?.strength(1.5)
      .radius((node: any) => ((node.size || 10) / 10) * 15);

    // Ajout d'une force radiale pour créer des clusters plus naturels
    d3.force('radial')
      ?.strength(0.1)
      .radius(100);
  }
};