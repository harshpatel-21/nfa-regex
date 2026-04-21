/**
 * AI assistance was used for graph-specific edge rendering work here,
 * especially framework-driven edge interactions and styling such as
 * highlighted transitions, removal state, and bend-handle behavior.
 */
import { memo, useRef } from 'react'
import {
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { useEdgeBendContext } from './EdgeBendContext'

export interface TransitionEdgeData {
  symbol: string
  isSelfLoop?: boolean
  isHighlighted?: boolean
  highlightColor?: string
  isBeingRemoved?: boolean
  bend?: { x: number; y: number }
  [key: string]: unknown
}

type TransitionEdgeProps = EdgeProps & { data?: TransitionEdgeData }

function TransitionEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  source,
  target,
}: TransitionEdgeProps) {
  const symbol = data?.symbol ?? ''
  const isHighlighted = data?.isHighlighted ?? false
  const highlightColor = data?.highlightColor ?? '#3b82f6'
  const isBeingRemoved = data?.isBeingRemoved ?? false
  const isSelfLoop = source === target

  const { bends, setEdgeBend } = useEdgeBendContext()
  const { getViewport } = useReactFlow()
  const bend = bends[id] ?? { x: 0, y: 0 }
  const isBent = bend.x !== 0 || bend.y !== 0

  // Persists handle position across renders during a drag
  const dragRef = useRef<{ hx: number; hy: number } | null>(null)

  const stroke = isBeingRemoved ? '#ef4444' : isHighlighted ? highlightColor : '#94a3b8'
  const strokeWidth = isHighlighted ? 2.5 : 1.5
  const strokeDasharray = isBeingRemoved ? '5,5' : undefined

  if (isSelfLoop) {
    const centerX = (sourceX + targetX) / 2
    const centerY = sourceY

    const nodeRadius = 32
    const loopHeight = 40
    const loopWidth = 30

    const topOfNode = centerY - nodeRadius
    const startX = centerX - 12
    const endX = centerX + 12

    const path = `
      M ${startX} ${topOfNode}
      C ${startX - loopWidth} ${topOfNode - loopHeight},
        ${endX + loopWidth} ${topOfNode - loopHeight},
        ${endX} ${topOfNode}
    `

    return (
      <>
        <path
          id={id}
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          markerEnd="url(#arrowhead)"
        />
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-none nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${centerX}px, ${topOfNode - loopHeight - 8}px)`,
            }}
          >
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-mono ${
                isHighlighted ? 'bg-yellow-100 font-semibold' : 'bg-white/90'
              }`}
              style={{ border: '1px solid #e2e8f0' }}
            >
              {symbol}
            </span>
          </div>
        </EdgeLabelRenderer>
      </>
    )
  }

  // Default bezier path — used when unbent, and as origin for first drag
  const [defaultPath, defaultLabelX, defaultLabelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const naturalMidX = (sourceX + targetX) / 2
  const naturalMidY = (sourceY + targetY) / 2

  // When bent: quadratic bezier with control point shifted so curve passes
  // through (naturalMid + bend) at t=0.5 → ctrl = naturalMid + 2*bend
  const edgePath = isBent
    ? `M ${sourceX} ${sourceY} Q ${naturalMidX + 2 * bend.x} ${naturalMidY + 2 * bend.y} ${targetX} ${targetY}`
    : defaultPath

  // Handle sits at the visual midpoint of the curve
  const handleX = isBent ? naturalMidX + bend.x : defaultLabelX
  const handleY = isBent ? naturalMidY + bend.y : defaultLabelY

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if ('setPointerCapture' in e.currentTarget) {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    // Start drag from the current visual midpoint (bezier or bent)
    dragRef.current = { hx: handleX, hy: handleY }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!(e.buttons & 1) || !dragRef.current) return
    const { zoom } = getViewport()
    dragRef.current.hx += e.movementX / zoom
    dragRef.current.hy += e.movementY / zoom
    setEdgeBend(id, dragRef.current.hx - naturalMidX, dragRef.current.hy - naturalMidY)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if ('releasePointerCapture' in e.currentTarget) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragRef.current = null
  }

  return (
    <>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        markerEnd="url(#arrowhead)"
      />
      <EdgeLabelRenderer>
        <div
          className="absolute nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${handleX}px, ${handleY}px)`,
            cursor: 'grab',
            pointerEvents: 'all',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-mono ${
              isHighlighted ? 'bg-yellow-100 font-semibold' : 'bg-white/90'
            }`}
            style={{ border: '1px solid #e2e8f0' }}
          >
            {symbol}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const TransitionEdge = memo(TransitionEdgeComponent)
