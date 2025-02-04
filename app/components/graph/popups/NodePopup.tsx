'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphNode } from '../types';

interface NodePopupProps {
  node: GraphNode;
  position: { x: number; y: number };
  onClose: () => void;
}

export const NodePopup: React.FC<NodePopupProps> = ({ node, position, onClose }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

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
          top: position.y,
          zIndex: 1000,
          pointerEvents: 'auto'
        }}
      >
        <Card className="w-96 p-4 bg-black/80 backdrop-blur-md border-none text-white">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold">{node.name}</h3>
              <Badge variant="secondary" className="mt-1">
                {node.type}
              </Badge>
            </div>
            {node.data?.year && (
              <Badge variant="outline">{node.data.year}</Badge>
            )}
          </div>

          <div className="space-y-3">
            {node.data?.artistNames && node.data.artistNames.length > 0 && (
              <div>
                <p className="text-sm text-gray-400">Artists</p>
                <p className="text-sm">{node.data.artistNames.join(', ')}</p>
              </div>
            )}

            {node.data?.labelName && (
              <div>
                <p className="text-sm text-gray-400">Label</p>
                <p className="text-sm">{node.data.labelName}</p>
              </div>
            )}

            {node.data?.styles && node.data.styles.length > 0 && (
              <div>
                <p className="text-sm text-gray-400">Styles</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {node.data.styles.map(style => (
                    <Badge key={style} variant="secondary" className="text-xs">
                      {style}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {node.type === 'cluster' && node.data?.count && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Contains {node.data.count} nodes
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};