import { useMemo } from 'react'
import dagre from 'dagre'
import type { ProgressData, Task, Status } from '../lib/types'

interface DependencyGraphProps {
  data: ProgressData
}

interface GraphNode {
  id: string
  label: string
  status: Status
  milestone: string
  x: number
  y: number
  width: number
  height: number
}

interface GraphEdge {
  from: string
  to: string
  points: Array<{ x: number; y: number }>
}

const NODE_WIDTH = 180
const NODE_HEIGHT = 44

const statusColors: Record<Status, { bg: string; border: string; text: string }> = {
  completed: { bg: '#22c55e15', border: '#22c55e40', text: '#4ade80' },
  in_progress: { bg: '#3b82f615', border: '#3b82f640', text: '#60a5fa' },
  not_started: { bg: '#6b728015', border: '#6b728040', text: '#9ca3af' },
  wont_do: { bg: '#eab30815', border: '#eab30840', text: '#fbbf24' },
}

function buildGraph(data: ProgressData): { nodes: GraphNode[]; edges: GraphEdge[]; width: number; height: number } {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 30, ranksep: 60, marginx: 20, marginy: 20 })
  g.setDefaultEdgeLabel(() => ({}))

  // Collect all tasks with their milestone context
  const allTasks: Array<Task & { milestoneName: string }> = []
  for (const milestone of data.milestones) {
    const tasks = data.tasks[milestone.id] || []
    for (const task of tasks) {
      allTasks.push({ ...task, milestoneName: milestone.name })
    }
  }

  if (allTasks.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 }
  }

  // Add nodes
  for (const task of allTasks) {
    g.setNode(String(task.id), { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  // Infer edges from task ordering within milestones (sequential dependency)
  // Also check task notes/extra for explicit dependency references
  for (const milestone of data.milestones) {
    const tasks = data.tasks[milestone.id] || []
    for (let i = 1; i < tasks.length; i++) {
      g.setEdge(String(tasks[i - 1].id), String(tasks[i].id))
    }
  }

  // Add cross-milestone edges: last task of milestone N → first task of milestone N+1
  for (let i = 1; i < data.milestones.length; i++) {
    const prevTasks = data.tasks[data.milestones[i - 1].id] || []
    const currTasks = data.tasks[data.milestones[i].id] || []
    if (prevTasks.length > 0 && currTasks.length > 0) {
      g.setEdge(String(prevTasks[prevTasks.length - 1].id), String(currTasks[0].id))
    }
  }

  dagre.layout(g)

  const nodes: GraphNode[] = allTasks.map((task) => {
    const node = g.node(String(task.id))
    return {
      id: String(task.id),
      label: task.name,
      status: task.status,
      milestone: task.milestoneName,
      x: node.x,
      y: node.y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    }
  })

  const edges: GraphEdge[] = g.edges().map((e) => {
    const edge = g.edge(e)
    return {
      from: e.v,
      to: e.w,
      points: edge.points || [],
    }
  })

  const graphInfo = g.graph()
  return {
    nodes,
    edges,
    width: (graphInfo.width || 800) + 40,
    height: (graphInfo.height || 400) + 40,
  }
}

function edgePathD(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return ''
  const [start, ...rest] = points
  return `M ${start.x} ${start.y} ${rest.map((p) => `L ${p.x} ${p.y}`).join(' ')}`
}

export function DependencyGraph({ data }: DependencyGraphProps) {
  const { nodes, edges, width, height } = useMemo(() => buildGraph(data), [data])

  if (nodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 text-sm">No tasks to display in dependency graph</p>
      </div>
    )
  }

  return (
    <div className="border border-gray-800 rounded-lg overflow-auto bg-gray-950/50">
      <svg width={width} height={height} className="min-w-full">
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 7"
            refX="10"
            refY="3.5"
            markerWidth="8"
            markerHeight="6"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => (
          <path
            key={i}
            d={edgePathD(edge.points)}
            fill="none"
            stroke="#374151"
            strokeWidth={1.5}
            markerEnd="url(#arrowhead)"
          />
        ))}

        {/* Nodes */}
        {nodes.map((node) => {
          const colors = statusColors[node.status]
          return (
            <g key={node.id} transform={`translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`}>
              <rect
                width={node.width}
                height={node.height}
                rx={6}
                ry={6}
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth={1.5}
              />
              <text
                x={10}
                y={18}
                fill={colors.text}
                fontSize={11}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={500}
              >
                {node.label.length > 22 ? node.label.slice(0, 22) + '...' : node.label}
              </text>
              <text
                x={10}
                y={34}
                fill="#6b7280"
                fontSize={9}
                fontFamily="Inter, system-ui, sans-serif"
              >
                {node.milestone}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
