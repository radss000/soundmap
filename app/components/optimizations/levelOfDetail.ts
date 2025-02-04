import { LODLevel } from '../types';

export class LODManager {
  private readonly HIGH_DETAIL_DISTANCE = 500;
  private readonly MEDIUM_DETAIL_DISTANCE = 1000;
  private readonly LABEL_DISTANCE = 1200;

  calculateLOD(cameraDistance: number): LODLevel {
    if (cameraDistance < this.HIGH_DETAIL_DISTANCE) {
      return {
        nodeDetail: 'high',
        showLabels: true,
        particleCount: 2,
        resolution: 16
      };
    } else if (cameraDistance < this.MEDIUM_DETAIL_DISTANCE) {
      return {
        nodeDetail: 'medium',
        showLabels: true,
        particleCount: 1,
        resolution: 8
      };
    } else {
      return {
        nodeDetail: 'low',
        showLabels: cameraDistance < this.LABEL_DISTANCE,
        particleCount: 0,
        resolution: 4
      };
    }
  }

  getNodeSize(baseSize: number, distance: number): number {
    const scale = Math.max(0.5, Math.min(1.5, 1000 / distance));
    return baseSize * scale;
  }

  shouldRenderLabel(distance: number, nodeSize: number): boolean {
    return distance < this.LABEL_DISTANCE && nodeSize > 3;
  }
}