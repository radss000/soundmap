'use client';

import { useGraphStore } from '@/lib/store/graphStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NodeDetails() {
  const { selectedNode, setSelectedNode } = useGraphStore();

  if (!selectedNode) return null;

  return (
    <Card className="absolute bottom-4 right-4 w-80 bg-background/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">{selectedNode.name}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedNode(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Badge className="mb-2">{selectedNode.type}</Badge>
        <p className="text-sm text-muted-foreground">
          {selectedNode.type === 'artist' && "Click to view artist's profile and discography"}
          {selectedNode.type === 'label' && "Click to explore label's releases and artists"}
          {selectedNode.type === 'release' && "Click to view release details and credits"}
        </p>
      </CardContent>
    </Card>
  );
}