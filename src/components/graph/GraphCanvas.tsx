/**
 * AI assistance was used for graph-specific React Flow command wiring
 * (fit view, connect handlers, and edge/node interaction flow) and for
 * visual styling behavior like highlighted paths and edge emphasis.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  MarkerType,
  type Node,
  type NodeChange,
  applyNodeChanges,
  useReactFlow,
} from '@xyflow/react'
import { useNFA } from '../../hooks/useNFA'
import { useAppContext } from '../../state/AppContext'
import { useGraphLayout } from '../../hooks/useGraphLayout'
import { StateNode } from './StateNode'
import { TransitionEdge } from './TransitionEdge'
import { GraphToolbar } from './GraphToolbar'
import { EdgeBendContext } from './EdgeBendContext'

function GraphCanvasInner() {
  const { nfa, nfaToRegexPhase, appMode } = useNFA()
  const { stateEliminationState, thompsonState } = useAppContext()

  const { fitView } = useReactFlow()
  const isThompson = appMode === 'regex-to-nfa'
  const isConverting = appMode === 'nfa-to-regex' && nfaToRegexPhase === 'converting'

  // Fit view when the user selects the correct Thompson template
  const prevTemplateCorrect = useRef(thompsonState.isTemplateCorrect)
  useEffect(() => {
    if (thompsonState.isTemplateCorrect === true && prevTemplateCorrect.current !== true) {
      requestAnimationFrame(() => fitView({ padding: 0.3, duration: 300 }))
    }
    prevTemplateCorrect.current = thompsonState.isTemplateCorrect
  }, [thompsonState.isTemplateCorrect, fitView])

  // Thompson: determine which NFA snapshot to show
  const thompsonDisplayNFA = useMemo(() => {
    if (!isThompson) return null
    const { phase, steps, currentStepIndex, isTemplateCorrect } = thompsonState
    if (phase === 'idle') return null
    if (phase === 'complete') return steps[steps.length - 1]?.nfaAfter ?? null
    // stepping: show current step result only after correct template selected
    if (isTemplateCorrect === true) return steps[currentStepIndex]?.nfaAfter ?? null
    return currentStepIndex > 0 ? (steps[currentStepIndex - 1]?.nfaAfter ?? null) : null
  }, [isThompson, thompsonState])

  const thompsonHighlight = useMemo(() => {
    if (!isThompson || thompsonState.phase !== 'stepping' || thompsonState.isTemplateCorrect !== true) {
      return undefined
    }
    const step = thompsonState.steps[thompsonState.currentStepIndex]
    if (!step) return undefined
    return { newStateIds: step.newStateIds, newTransitionIds: step.newTransitionIds }
  }, [isThompson, thompsonState])

  // Use GTG during NFA→Regex conversion, Thompson NFA in regex-to-nfa mode, else user NFA
  const graphData = isThompson
    ? thompsonDisplayNFA
    : isConverting && stateEliminationState.gtg
    ? stateEliminationState.gtg
    : nfa

  // Build highlight info for NFA→Regex conversion mode
  const currentPath =
    isConverting &&
    stateEliminationState.currentPathUpdates.length > 0 &&
    stateEliminationState.currentPathIndex < stateEliminationState.currentPathUpdates.length
      ? stateEliminationState.currentPathUpdates[stateEliminationState.currentPathIndex] ?? null
      : null

  const highlight = useMemo(
    () =>
      isConverting
        ? {
            stateToRemove: stateEliminationState.stateToRemove,
            currentPath,
            highlightedR: stateEliminationState.highlightedR,
          }
        : undefined,
    [isConverting, stateEliminationState.stateToRemove, currentPath, stateEliminationState.highlightedR]
  )

  const { nodes: layoutedNodes, edges } = useGraphLayout(graphData, { highlight, thompsonHighlight })

  // Track manually dragged positions so they survive re-renders
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({})
  const [displayNodes, setDisplayNodes] = useState<Node[]>(layoutedNodes)

  // Ref so the layout effect can read current displayed positions without a stale closure
  const displayNodesRef = useRef<Node[]>(layoutedNodes)
  useEffect(() => {
    displayNodesRef.current = displayNodes
  }, [displayNodes])

  // Track edge bend offsets so they survive re-renders
  const [edgeBends, setEdgeBends] = useState<Record<string, { x: number; y: number }>>({})
  const setEdgeBend = useCallback((id: string, x: number, y: number) => {
    setEdgeBends((prev) => ({ ...prev, [id]: { x, y } }))
  }, [])

  const displayEdges = useMemo(
    () => edges.map((e) => ({ ...e, data: { ...e.data, bend: edgeBends[e.id] } })),
    [edges, edgeBends]
  )

  // When layout changes, merge in saved positions.
  // During state elimination, preserve the current displayed positions for remaining
  // nodes so that eliminating a node doesn't trigger a full dagre re-layout.
  useEffect(() => {
    if (isConverting) {
      const currentPositions: Record<string, { x: number; y: number }> = {}
      for (const node of displayNodesRef.current) {
        currentPositions[node.id] = node.position
      }
      setDisplayNodes(
        layoutedNodes.map((node) => ({
          ...node,
          position: currentPositions[node.id] ?? nodePositions[node.id] ?? node.position,
        }))
      )
    } else {
      setDisplayNodes(
        layoutedNodes.map((node) => ({
          ...node,
          position: nodePositions[node.id] ?? node.position,
        }))
      )
    }
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
    <EdgeBendContext.Provider value={{ bends: edgeBends, setEdgeBend }}>
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable
        nodesConnectable={false}
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

    </div>
    </EdgeBendContext.Provider>
  )
}

export function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner />
    </ReactFlowProvider>
  )
}
