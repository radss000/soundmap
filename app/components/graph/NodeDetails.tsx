'use client';

import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NodeDetailsProps {
  node: any;
  onClose: () => void;
}

export function NodeDetails({ node, onClose }: NodeDetailsProps) {
  if (!node) return null;

  return (
    <Card className="absolute top-4 right-4 w-96 bg-black/80 backdrop-blur-sm text-white border-none p-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">{node.name}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-300">Type: {node.type}</p>
        
        {node.data?.artistNames && (
          <div>
            <p className="text-sm font-medium text-gray-400">Artists</p>
            <p className="text-sm text-white">
              {node.data.artistNames.join(', ')}
            </p>
          </div>
        )}
        
        {node.data?.labelName && (
          <div>
            <p className="text-sm font-medium text-gray-400">Label</p>
            <p className="text-sm text-white">{node.data.labelName}</p>
          </div>
        )}
        
        {node.data?.styles && (
          <div>
            <p className="text-sm font-medium text-gray-400">Styles</p>
            <div className="flex flex-wrap gap-1">
              {node.data.styles.map((style: string) => (
                <span
                  key={style}
                  className="text-xs bg-white/10 px-2 py-1 rounded-full"
                >
                  {style}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}