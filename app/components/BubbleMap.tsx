// app/releases/components/BubbleMap.tsx
'use client'

import { useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Card } from '@/components/ui/card'

type Release = {
  id: string
  title: string
  labelName: string | null
  artistNames: string[]
  styles: string[]
}

type Node = {
  id: string
  name: string
  val: number // Size of node
  color: string
  releases?: Release[]
}

type Link = {
  source: string
  target: string
  value: number
}

interface Props {
  releases: Release[]
}

const COLORS = [
  '#ff41b4', '#ff4d94', '#ff5a74', '#ff6854', 
  '#ff7634', '#ff8414', '#ff9400', '#f5a500'
]

export function BubbleMap({ releases }: Props) {
  const { nodes, links } = useMemo(() => {
    // Group releases by label
    const labelGroups = new Map<string, Release[]>()
    releases.forEach(release => {
      const label = release.labelName || 'Unknown'
      const group = labelGroups.get(label) || []
      labelGroups.set(label, [...group, release])
    })

    // Create nodes for each label with 3+ releases
    const nodes: Node[] = Array.from(labelGroups)
      .filter(([_, releases]) => releases.length >= 3)
      .map(([label, releases], i) => ({
        id: label,
        name: label,
        val: Math.sqrt(releases.length) * 5,
        color: COLORS[i % COLORS.length],
        releases
      }))

    // Create links between labels that share styles
    const links: Link[] = []
    nodes.forEach((node1, i) => {
      nodes.slice(i + 1).forEach(node2 => {
        const styles1 = new Set(node1.releases?.flatMap(r => r.styles))
        const styles2 = new Set(node2.releases?.flatMap(r => r.styles))
        const common = [...styles1].filter(s => styles2.has(s))
        if (common.length > 0) {
          links.push({
            source: node1.id,
            target: node2.id,
            value: common.length
          })
        }
      })
    })

    return { nodes, links }
  }, [releases])

  return (
    <ForceGraph2D
      graphData={{ nodes, links }}
      backgroundColor="#000"
      nodeLabel="name"
      nodeColor={node => (node as Node).color}
      nodeVal={node => (node as Node).val}
      linkColor={() => '#ffffff20'}
      linkWidth={link => (link as Link).value / 2}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const label = (node as Node).name
        const fontSize = 12 / globalScale
        ctx.font = `${fontSize}px Sans-Serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = (node as Node).color
        ctx.fillText(label, node.x!, node.y!)
      }}
      width={window.innerWidth}
      height={window.innerHeight}
      dagMode="radial"
      dagLevelDistance={100}
    />
  )
}