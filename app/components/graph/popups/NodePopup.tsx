'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode } from '../types';
import { 
  ChevronDown, 
  Disc, 
  Music, 
  Users, 
  Tag,
  Building,
  Youtube 
} from 'lucide-react';

interface NodePopupProps {
  node: GraphNode;
  position: { x: number; y: number };
  onClose: () => void;
  onExpandCluster?: () => void;
}

export const NodePopup: React.FC<NodePopupProps> = ({ 
  node, 
  position, 
  onClose,
  onExpandCluster 
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const renderContent = () => {
    switch (node.type) {
      case 'cluster':
        return (
          <>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold">{node.name}</h3>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">
                    {node.data?.count} releases
                  </Badge>
                  {node.data?.mainLabel && (
                    <Badge variant="outline">
                      {node.data.mainLabel}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {node.data?.styles && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Main Styles</p>
                <div className="flex flex-wrap gap-1">
                  {node.data.styles.slice(0, 5).map(style => (
                    <Badge key={style} variant="secondary" className="text-xs">
                      {style}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {onExpandCluster && (
              <Button
                onClick={onExpandCluster}
                className="w-full mt-4 bg-primary/20 hover:bg-primary/30"
              >
                <ChevronDown className="mr-2 h-4 w-4" />
                Show Releases
              </Button>
            )}
          </>
        );

      case 'release':
        return (
          <>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold">{node.name}</h3>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">
                    Release
                  </Badge>
                  {node.data?.year && (
                    <Badge variant="outline">
                      {node.data.year}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {node.data?.artistNames && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">{node.data.artistNames.join(', ')}</p>
                </div>
              </div>
            )}

            {node.data?.labelName && (
              <div className="flex items-center gap-2 mt-2">
                <Building className="h-4 w-4 text-gray-400" />
                <p className="text-sm">{node.data.labelName}</p>
              </div>
            )}

            {node.data?.styles && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-400">Styles</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {node.data.styles.map(style => (
                    <Badge key={style} variant="secondary" className="text-xs">
                      {style}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {node.data?.tracks && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Disc className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-400">Tracks</p>
                </div>
                <div className="space-y-2">
                  {node.data.tracks.map((track: any) => (
                    <div key={track.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{track.title}</span>
                      </div>
                      {track.youtubeUrl && (
                        <a 
                          href={track.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-red-500 hover:text-red-400"
                        >
                          <Youtube className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );

      case 'track':
        return (
          <>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold">{node.name}</h3>
                <Badge variant="secondary" className="mt-1">
                  Track
                </Badge>
              </div>
              {node.data?.duration && (
                <Badge variant="outline">
                  {node.data.duration}
                </Badge>
              )}
            </div>

            {node.data?.artists && (
              <div className="flex items-center gap-2 mt-2">
                <Users className="h-4 w-4 text-gray-400" />
                <p className="text-sm">{node.data.artists.join(', ')}</p>
              </div>
            )}

            {node.data?.youtubeUrl && (
              <Button
                className="w-full mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-500"
                onClick={() => window.open(node.data?.youtubeUrl, '_blank')}
              >
                <Youtube className="mr-2 h-4 w-4" />
                Watch on YouTube
              </Button>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        style={{
          position: 'absolute',
          left: position.x,
          top