import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { SlidersHorizontal } from 'lucide-react';

const ForceGraph = dynamic(() => 
  import('react-force-graph-3d').then(mod => {
    const Component = mod.default;
    return React.forwardRef((props, ref) => <Component {...props} ref={ref} />);
  }), 
  { ssr: false }
);

const COLOR_SCHEME = {
  genre: '#2196F3',
  subgenre: '#4CAF50',
  artist: '#FF4081',
  label: '#FFC107',
  release: '#9C27B0',
  default: '#9E9E9E'
};

const EnhancedGraph = () => {
  const fgRef = useRef();
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    styles: []
  });
  const [uniqueStyles, setUniqueStyles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/releases/2008');
        const releases = await response.json();
        
        const styles = [...new Set(releases.flatMap(r => r.styles || []))].sort();
        setUniqueStyles(styles);

        const nodes = releases.map(release => ({
          id: release.id,
          name: release.title,
          type: 'release',
          val: 5,
          color: COLOR_SCHEME.release,
          data: release
        }));

        const links = [];
        for (let i = 0; i < nodes.length - 1; i++) {
          if (nodes[i].data.labelName === nodes[i + 1].data.labelName) {
            links.push({
              source: nodes[i].id,
              target: nodes[i + 1].id,
              value: 1
            });
          }
        }

        setData({ nodes, links });
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize graph:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = React.useMemo(() => {
    let filteredNodes = data.nodes;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredNodes = filteredNodes.filter(node => 
        node.name.toLowerCase().includes(searchLower) ||
        node.data?.artistNames?.some(artist => 
          artist.toLowerCase().includes(searchLower)
        )
      );
    }

    if (filters.styles.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        node.data?.styles?.some(style => 
          filters.styles.includes(style)
        )
      );
    }

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = data.links.filter(link =>
      nodeIds.has(link.source.id || link.source) && 
      nodeIds.has(link.target.id || link.target)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [data, filters]);

  const handleNodeClick = useCallback(node => {
    if (!node || !fgRef.current) return;
    
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      2000
    );

    setSelectedNode(node);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        Loading visualization...
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 flex gap-4 bg-black/50 p-4 rounded-lg">
        <Input
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          placeholder="Search releases..."
          className="w-64 text-white bg-black/50"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-black/50 text-white">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Styles ({filters.styles.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-96 overflow-y-auto bg-black/90 text-white">
            {uniqueStyles.map(style => (
              <DropdownMenuCheckboxItem
                key={style}
                checked={filters.styles.includes(style)}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    styles: checked 
                      ? [...prev.styles, style]
                      : prev.styles.filter(s => s !== style)
                  }));
                }}
              >
                {style}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ForceGraph
        ref={fgRef}
        graphData={filteredData}
        nodeLabel="name"
        nodeColor="color"
        nodeVal={node => node.val}
        backgroundColor="#000000"
        showNavInfo={false}
        onNodeClick={handleNodeClick}
        linkWidth={2}
        linkOpacity={0.2}
        linkDirectionalParticles={1}
        nodeThreeObject={node => {
          const geometry = new THREE.SphereGeometry(5);
          const material = new THREE.MeshPhongMaterial({
            color: node.color,
            transparent: true,
            opacity: 0.75,
            shininess: 100
          });
          return new THREE.Mesh(geometry, material);
        }}
      />
      
      {selectedNode && (
        <Card className="absolute top-4 right-4 p-4 w-96 bg-black/80 backdrop-blur-sm text-white border-none">
          <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
          <div className="space-y-2">
            {selectedNode.data?.artistNames && (
              <p className="text-gray-300">Artists: {selectedNode.data.artistNames.join(', ')}</p>
            )}
            {selectedNode.data?.labelName && (
              <p className="text-gray-300">Label: {selectedNode.data.labelName}</p>
            )}
            {selectedNode.data?.styles && (
              <p className="text-gray-300">Styles: {selectedNode.data.styles.join(', ')}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EnhancedGraph;