import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo } from 'react';

interface StateNodeData {
  label: string;
  isStart: boolean;
  isFinal: boolean;
  isEliminating?: boolean;
  isHighlighted?: boolean;
  [key: string]: unknown;
}

function StateNodeComponent({ data }: NodeProps) {
  const { label, isStart, isFinal, isEliminating, isHighlighted } = data as StateNodeData;

  let borderClass = 'border-2 border-gray-700';
  if (isEliminating) borderClass = 'border-2 border-red-500';
  if (isHighlighted) borderClass = 'border-2 border-blue-500';

  return (
    <div className="relative flex items-center justify-center">
      {isStart && (
        <div className="absolute -left-6 text-gray-700 text-lg">▶</div>
      )}
      <div
        className={`w-16 h-16 rounded-full ${borderClass} bg-white flex items-center justify-center text-sm font-semibold shadow-md ${
          isFinal ? 'ring-2 ring-gray-700 ring-offset-2' : ''
        }`}
      >
        {label}
      </div>
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

export const StateNode = memo(StateNodeComponent);
