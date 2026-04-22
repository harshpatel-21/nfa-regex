/**
 * AI assistance was used mainly for styling in this component
 * (visual presentation, class tuning, and UI polish).
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStateElimination } from "../../hooks/useStateElimination";

interface RValueInfo {
  label: string;
  value: string;
  color: string;
  bgColor: string;
  description: string;
}

interface FormulaDisplayProps {
  R1: string;
  R2: string;
  R3: string;
  R4: string;
  predecessorLabel: string;
  successorLabel: string;
  removedStateLabel: string;
}

/**
 * Display the four R-values for the current elimination path alongside the elimination formula.
 * Hovering an R-value fires setHighlightedR to highlight the corresponding edge on the graph.
 */
export function FormulaDisplay({
  R1,
  R2,
  R3,
  R4,
  predecessorLabel,
  successorLabel,
  removedStateLabel,
}: FormulaDisplayProps) {
  const { setHighlightedR } = useStateElimination();
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  const rValues: RValueInfo[] = [
    {
      label: "R\u2081",
      value: R1,
      color: "border-blue-400 text-blue-700",
      bgColor: "bg-blue-50",
      description: `Transition from ${predecessorLabel} to ${removedStateLabel}`,
    },
    {
      label: "R\u2082",
      value: R2,
      color: "border-orange-400 text-orange-700",
      bgColor: "bg-orange-50",
      description: `Self-loop on ${removedStateLabel} (state being eliminated)`,
    },
    {
      label: "R\u2083",
      value: R3,
      color: "border-green-400 text-green-700",
      bgColor: "bg-green-50",
      description: `Transition from ${removedStateLabel} to ${successorLabel}`,
    },
    {
      label: "R\u2084",
      value: R4,
      color: "border-purple-400 text-purple-700",
      bgColor: "bg-purple-50",
      description: `Existing direct transition from ${predecessorLabel} to ${successorLabel}`,
    },
  ];

  const rHighlightMap: Record<number, "R1" | "R2" | "R3" | "R4"> = {
    0: "R1",
    1: "R2",
    2: "R3",
    3: "R4",
  };

  return (
    <div className="flex flex-col gap-3">
      {/* R-value boxes */}
      <div className="grid grid-cols-2 gap-2">
        {rValues.map((rv, i) => (
          <div
            key={rv.label}
            className="relative"
            onMouseEnter={() => setHighlightedR(rHighlightMap[i] ?? null)}
            onMouseLeave={() => setHighlightedR(null)}
          >
            {/* Label */}
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold ${rv.color}`}>
                {rv.label}
              </span>
              {/* Info button */}
              <button
                onClick={() =>
                  setOpenTooltip(openTooltip === rv.label ? null : rv.label)
                }
                className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-bold cursor-pointer transition-colors ${
                  openTooltip === rv.label
                    ? "bg-gray-700 text-white border-gray-700"
                    : "bg-white text-gray-400 border-gray-300 hover:border-gray-500 hover:text-gray-600"
                }`}
                aria-label={`What is ${rv.label}?`}
                title={`What is ${rv.label}?`}
              >
                i
              </button>
            </div>
            {/* Value box */}
            <div
              className={`rounded border-2 px-2 py-1.5 font-mono text-sm text-center min-h-[32px] ${rv.color} ${rv.bgColor}`}
            >
              {rv.value}
            </div>
            {/* Tooltip popover */}
            <AnimatePresence>
              {openTooltip === rv.label && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-10 top-full mt-1 left-0 right-0 rounded-lg bg-gray-800 px-3 py-2 text-xs text-white shadow-lg"
                >
                  {rv.description}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Formula template */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-center">
        <span className="text-xs text-gray-500">Formula: </span>
        <span className="font-mono text-sm">
          <span className="text-purple-600 font-semibold">R₄</span>
          <span className="text-gray-500"> + (</span>
          <span className="text-blue-600 font-semibold">R₁</span>
          <span className="text-gray-500"> · </span>
          <span className="text-orange-600 font-semibold">R₂</span>
          <span className="text-gray-500">* · </span>
          <span className="text-green-600 font-semibold">R₃</span>
          <span className="text-gray-500">)</span>
        </span>
      </div>
    </div>
  );
}
