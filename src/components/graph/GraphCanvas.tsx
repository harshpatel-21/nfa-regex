import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  type OnConnect,
  type Connection,
  ReactFlowProvider,
  MarkerType,
  type Node,
  type NodeChange,
  applyNodeChanges,
} from '@xyflow/react'
import { useNFA } from '../../hooks/useNFA'
import { useAppContext } from '../../state/AppContext'
import { useGraphLayout } from '../../hooks/useGraphLayout'
import { StateNode } from './StateNode'
import { TransitionEdge } from './TransitionEdge'
import { GraphToolbar } from './GraphToolbar'

function GraphCanvasInner() {
  const { nfa, nfaToRegexPhase, appMode } = useNFA()
  const { conversionState } = useAppContext()
  const { addTransition } = useNFA()

  // Use GTG during conversion, NFA during input
  const graphData =
    appMode === 'nfa-to-regex' && nfaToRegexPhase === 'converting' && conversionState.gtg
      ? conversionState.gtg
      : nfa

  // Build highlight info for conversion mode
  const isConverting = nfaToRegexPhase === 'converting'
  const currentPath =
    isConverting &&
    conversionState.currentPathUpdates.length > 0 &&
    conversionState.currentPathIndex < conversionState.currentPathUpdates.length
      ? conversionState.currentPathUpdates[conversionState.currentPathIndex] ?? null
      : null

  const highlight = isConverting
    ? {
        stateToRemove: conversionState.stateToRemove,
        currentPath,
        highlightedR: conversionState.highlightedR,
      }
    : undefined

  const { nodes: layoutedNodes, edges } = useGraphLayout(graphData, { highlight })

  // Track manually dragged positions so they survive re-renders
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({})
  const [displayNodes, setDisplayNodes] = useState<Node[]>(layoutedNodes)

  // When layout changes (graph structure or highlight update), merge in saved positions
  useEffect(() => {
    setDisplayNodes(
      layoutedNodes.map((node) => ({
        ...node,
        position: nodePositions[node.id] ?? node.position,
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutedNodes])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setDisplayNodes((prev) => applyNodeChanges(changes, prev))
    const posChanges: Record<string, { x: number; y: number }> = {}
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        posChanges[change.id] = change.position
      }
    }
    if (Object.keys(posChanges).length > 0) {
      setNodePositions((prev) => ({ ...prev, ...posChanges }))
    }
  }, [])

  const nodeTypes = useMemo(() => ({ stateNode: StateNode }), [])
  const edgeTypes = useMemo(() => ({ transitionEdge: TransitionEdge }), [])

  // Connection dialog state
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(
    null
  )
  const [symbolInput, setSymbolInput] = useState('')

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (nfaToRegexPhase === 'converting') return
      setPendingConnection(connection)
      setSymbolInput('')
    },
    [nfaToRegexPhase]
  )

  const handleAddConnection = () => {
    if (pendingConnection && symbolInput.trim()) {
      const source = pendingConnection.source
      const target = pendingConnection.target
      if (source && target) {
        addTransition(source, target, symbolInput.trim())
      }
      setPendingConnection(null)
      setSymbolInput('')
    }
  }

  const defaultEdgeOptions = useMemo(
    () => ({
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#94a3b8',
      },
    }),
    []
  )

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable
        nodesConnectable={nfaToRegexPhase === 'input'}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
        <GraphToolbar />
        {/* Custom arrowhead marker */}
        <svg>
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>

      {/* Connection symbol dialog */}
      {pendingConnection && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-lg bg-white p-4 shadow-xl">
            <p className="mb-2 text-sm text-gray-700">
              Enter transition symbol:
            </p>
            <input
              type="text"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddConnection()
                if (e.key === 'Escape') setPendingConnection(null)
              }}
              autoFocus
              className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm font-mono"
              placeholder="e.g., a, b, ε"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingConnection(null)}
                className="rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddConnection}
                disabled={!symbolInput.trim()}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner />
    </ReactFlowProvider>
  )
}
