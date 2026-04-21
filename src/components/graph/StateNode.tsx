/**
 * AI assistance was used for graph-specific visual styling in this file,
 * including state highlighting and display treatment for graph interactions.
 */
import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

export interface StateNodeData {
  label: string
  isStart: boolean
  isFinal: boolean
  isBeingEliminated?: boolean
  isPredecessor?: boolean
  isSuccessor?: boolean
  isNewlyAdded?: boolean
  [key: string]: unknown
}

type StateNodeProps = NodeProps & { data: StateNodeData }

function StateNodeComponent({ data, selected }: StateNodeProps) {
  const {
    label,
    isStart,
    isFinal,
    isBeingEliminated,
    isPredecessor,
    isSuccessor,
    isNewlyAdded,
  } = data

  let borderColor = 'border-gray-400'
  if (isBeingEliminated) borderColor = 'border-red-500'
  else if (isPredecessor) borderColor = 'border-blue-500'
  else if (isSuccessor) borderColor = 'border-green-500'
  else if (isNewlyAdded) borderColor = 'border-amber-500'
  else if (selected) borderColor = 'border-blue-400'
  else if (isStart) borderColor = 'border-green-500'

  const bgColor = isBeingEliminated
    ? 'bg-red-50'
    : isNewlyAdded
    ? 'bg-amber-50'
    : 'bg-white'

  return (
    <div className="relative">
      {/* Start state arrow */}
      {isStart && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-green-600 text-lg">
          →
        </div>
      )}
      {/* Outer circle (double for final states) */}
      <div
        className={`flex items-center justify-center rounded-full border-2 ${bgColor} ${borderColor} ${
          isFinal ? 'p-1' : 'w-16 h-16'
        }`}
        style={isFinal ? { width: 64, height: 64 } : undefined}
      >
        {isFinal ? (
          <div
            className={`flex items-center justify-center rounded-full border-2 ${borderColor} w-12 h-12`}
          >
            <span className="text-xs font-mono font-semibold">{label}</span>
          </div>
        ) : (
          <span className="text-xs font-mono font-semibold">{label}</span>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-gray-400 !border-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-gray-400 !border-none"
      />
    </div>
  )
}

export const StateNode = memo(StateNodeComponent)
