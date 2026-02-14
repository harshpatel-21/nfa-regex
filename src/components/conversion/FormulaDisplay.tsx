import type { PathUpdate } from '../../core/types';

interface FormulaDisplayProps {
  path: PathUpdate;
  fromLabel: string;
  toLabel: string;
  removedLabel: string;
}

export function FormulaDisplay({ path, fromLabel, toLabel, removedLabel }: FormulaDisplayProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Path: {fromLabel} → {removedLabel} → {toLabel}
      </p>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-white rounded px-2 py-1 border border-gray-100">
          <span className="text-gray-500 text-xs">R₁</span>
          <span className="ml-1.5 font-mono text-gray-800">{path.R1}</span>
          <span className="text-xs text-gray-400 ml-1">({fromLabel}→{removedLabel})</span>
        </div>
        <div className="bg-white rounded px-2 py-1 border border-gray-100">
          <span className="text-gray-500 text-xs">R₂</span>
          <span className="ml-1.5 font-mono text-gray-800">{path.R2}</span>
          <span className="text-xs text-gray-400 ml-1">(self-loop)</span>
        </div>
        <div className="bg-white rounded px-2 py-1 border border-gray-100">
          <span className="text-gray-500 text-xs">R₃</span>
          <span className="ml-1.5 font-mono text-gray-800">{path.R3}</span>
          <span className="text-xs text-gray-400 ml-1">({removedLabel}→{toLabel})</span>
        </div>
        <div className="bg-white rounded px-2 py-1 border border-gray-100">
          <span className="text-gray-500 text-xs">R₄</span>
          <span className="ml-1.5 font-mono text-gray-800">{path.R4}</span>
          <span className="text-xs text-gray-400 ml-1">(existing {fromLabel}→{toLabel})</span>
        </div>
      </div>

      <div className="text-xs text-gray-500 border-t border-gray-200 pt-2 mt-2">
        Formula: R₄ + (R₁ · R₂* · R₃)
      </div>
    </div>
  );
}
