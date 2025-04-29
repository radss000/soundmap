// lib/clustering.ts
import { type Release } from './types';

export interface Cluster {
  id: string;
  type: 'cluster';
  label: string;
  count: number;
  radius: number;
  releases: Release[];
  x?: number;
  y?: number;
  color: string;
}

export function createClusters(releases: Release[]): Cluster[] {
  // Group by label
  const labelGroups = new Map<string, Release[]>();
  
  releases.forEach(release => {
    const label = release.labelName || 'Unknown';
    if (!labelGroups.has(label)) {
      labelGroups.set(label, []);
    }
    labelGroups.get(label)!.push(release);
  });

  // Create clusters from groups
  return Array.from(labelGroups.entries())
    .filter(([_, releases]) => releases.length >= 3) // Min cluster size
    .map(([label, releases]) => ({
      id: `cluster-${label}`,
      type: 'cluster' as const,
      label,
      count: releases.length,
      radius: Math.sqrt(releases.length) * 5, // Scale radius by sqrt of size
      releases,
      color: `hsl(${Math.random() * 360}, 70%, 50%)` // Random hue
    }));
}