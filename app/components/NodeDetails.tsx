// components/NodeDetails.tsx
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'
import { type Node } from '@/types/graph'

interface Props {
  node: Node
  onClose: () => void
}

export function NodeDetails({ node, onClose }: Props) {
  const releases = node.releases || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute right-4 top-4 w-96"
    >
      <Card className="bg-black/80 backdrop-blur text-white p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">{node.label}</h3>
            <p className="text-sm text-gray-400">
              {releases.length} releases
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Release styles */}
          <div>
            <h4 className="text-sm font-medium mb-2">Styles</h4>
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(releases.flatMap(r => r.styles))).map(style => (
                <span 
                  key={style}
                  className="px-2 py-1 rounded-full text-xs bg-white/10"
                >
                  {style}
                </span>
              ))}
            </div>
          </div>

          {/* Release list */}
          <div>
            <h4 className="text-sm font-medium mb-2">Recent Releases</h4>
            <div className="space-y-2">
              {releases.slice(0, 5).map(release => (
                <div key={release.id} className="text-sm">
                  <p className="font-medium">{release.title}</p>
                  <p className="text-gray-400">
                    {release.artistNames.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}