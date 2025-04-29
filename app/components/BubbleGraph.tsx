// components/BubbleGraph.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type Node, type Link, type Hover, type Release } from '@/types/graph'
import { WebGLRenderer } from '@/lib/webgl/renderer'
import { NodeDetails } from './NodeDetails'
import { createForceSimulation } from '@/lib/simulation'
import { useWindowSize } from '@/hooks/useWindowSize'

interface Props {
  releases: Release[]
}

export function BubbleGraph({ releases }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<WebGLRenderer>()
  const [hover, setHover] = useState<Hover>({ nodeId: null, x: 0, y: 0 })
  const [selected, setSelected] = useState<string | null>(null)
  const { width, height } = useWindowSize()
  
  // Initialize WebGL renderer
  useEffect(() => {
    if (!canvasRef.current) return
    rendererRef.current = new WebGLRenderer(canvasRef.current)
  }, [])

  // Transform releases into graph data
  const { nodes, links } = useMemo(() => {
    // Group by label first
    const labelGroups = new Map<string, Release[]>()
    releases.forEach(release => {
      const label = release.labelName || 'Unknown'
      labelGroups.set(label, [...(labelGroups.get(label) || []), release])
    })

    // Create label nodes (size by release count)
    const nodes: Node[] = Array.from(labelGroups.entries())
      .filter(([_, group]) => group.length >= 3)
      .map(([label, group]) => ({
        id: label,
        label,
        type: 'label',
        size: Math.sqrt(group.length) * 3,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        releases: group
      }))

    // Connect nodes that share music styles
    const links: Link[] = nodes.flatMap((node1, i) => 
      nodes.slice(i + 1).map(node2 => {
        const styles1 = new Set(node1.releases?.flatMap(r => r.styles))
        const styles2 = new Set(node2.releases?.flatMap(r => r.styles))
        const commonStyles = [...styles1].filter(s => styles2.has(s))
        return {
          source: node1.id,
          target: node2.id,
          strength: commonStyles.length / 10
        }
      }).filter(link => link.strength > 0)
    )

    return { nodes, links }
  }, [releases])

  // Handle mouse interaction
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Find hovered node
    const node = nodes.find(node => {
      const dx = (node.x || 0) - x
      const dy = (node.y || 0) - y
      return Math.sqrt(dx * dx + dy * dy) < node.size
    })

    setHover({ 
      nodeId: node?.id || null, 
      x: event.clientX,
      y: event.clientY
    })
  }, [nodes])

  const handleClick = useCallback(() => {
    setSelected(hover.nodeId)
  }, [hover.nodeId])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      
      {/* Hover tooltip */}
      {hover.nodeId && (
        <div 
          className="absolute pointer-events-none bg-white/10 px-2 py-1 rounded text-sm text-white"
          style={{ 
            left: hover.x + 10, 
            top: hover.y + 10 
          }}
        >
          {nodes.find(n => n.id === hover.nodeId)?.label}
        </div>
      )}

      {/* Selected node details */}
      {selected && (
        <NodeDetails
          node={nodes.find(n => n.id === selected)!}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}