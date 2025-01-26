// hooks/useGraphOptimization.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { debounce } from 'lodash';

const CHUNK_SIZE = 1000;
const LOD_DISTANCES = {
  HIGH: 100,
  MEDIUM: 300,
  LOW: 500
};

export const useGraphOptimization = (graphRef) => {
  const workerRef = useRef();
  const [visibleNodes, setVisibleNodes] = useState([]);
  
  // LOD System
  const updateNodeDetail = useCallback((distance) => {
    if (distance < LOD_DISTANCES.HIGH) {
      return { segments: 32, resolution: 32 };
    } else if (distance < LOD_DISTANCES.MEDIUM) {
      return { segments: 16, resolution: 16 };
    }
    return { segments: 8, resolution: 8 };
  }, []);

  // Frustum Culling
  const getFrustumVisibleNodes = useCallback((camera, nodes) => {
    const frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    return nodes.filter(node => {
      const position = new THREE.Vector3(node.x, node.y, node.z);
      return frustum.containsPoint(position);
    });
  }, []);

  // Chunked Data Loading
  const loadDataInChunks = useCallback(async (data) => {
    const chunks = [];
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      chunks.push(data.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
      setVisibleNodes(prev => [...prev, ...chunk]);
    }
  }, []);

  // Camera Movement Optimization
  const debouncedCameraUpdate = useCallback(
    debounce((camera) => {
      const visible = getFrustumVisibleNodes(camera, visibleNodes);
      setVisibleNodes(visible);
    }, 100),
    [visibleNodes, getFrustumVisibleNodes]
  );

  useEffect(() => {
    if (!graphRef.current) return;

    const handleCameraMove = () => {
      const camera = graphRef.current.camera();
      debouncedCameraUpdate(camera);
    };

    graphRef.current.controls().addEventListener('change', handleCameraMove);
    return () => {
      graphRef.current?.controls().removeEventListener('change', handleCameraMove);
    };
  }, [debouncedCameraUpdate]);

  return {
    visibleNodes,
    loadDataInChunks,
    updateNodeDetail
  };
};