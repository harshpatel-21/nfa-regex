/**
 * AI assistance was used mainly for styling in this component
 * (visual presentation, class tuning, and UI polish).
 */
import { useState } from "react";
import { motion } from "framer-motion";
import type { PathUpdate, GTG } from "../../core/types";
import { useStateElimination } from "../../hooks/useStateElimination";
import { FormulaDisplay } from "./FormulaDisplay";
import { Button } from "../common/Button";

interface PathUpdateFormProps {
  pathUpdate: PathUpdate;
  pathIndex: number;
  removedStateLabel: string;
  gtg: GTG | null;
}

/**
 * Form for a single path update during state elimination.
 * Shows the elimination formula with R-values, accepts a user regex answer, and provides auto-complete.
 */
export function PathUpdateForm({
  pathUpdate,
  pathIndex,
  removedStateLabel,
  gtg,
}: PathUpdateFormProps) {
  const { submitAnswer, autoCompletePath, advancePath } = useStateElimination();
  const [userInput, setUserInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const predecessorLabel =
    gtg?.states.find((s) => s.id === pathUpdate.from)?.label ?? pathUpdate.from;
  const successorLabel =
    gtg?.states.find((s) => s.id === pathUpdate.to)?.label ?? pathUpdate.to;

  const handleCheck = () => {
    submitAnswer(pathIndex, userInput.trim());
    setHasSubmitted(true);
  };

  const handleAutoComplete = () => {
    autoCompletePath(pathIndex);
    setUserInput(pathUpdate.expectedResult);
    setHasSubmitted(true);
  };

  const handleNext = () => {
    setUserInput("");
    setHasSubmitted(false);
    setShowAnswer(false);
    advancePath();
  };

  const isCorrect = pathUpdate.isCorrect;

  return (
    <div className="flex flex-col gap-3">
      {/* Path header */}
      <p className="text-xs text-gray-600">
        Path:{" "}
        <span className="font-mono font-semibold">
          {predecessorLabel} → {successorLabel}
        </span>
      </p>

      {/* Formula display */}
      <FormulaDisplay
        R1={pathUpdate.R1}
        R2={pathUpdate.R2}
        R3={pathUpdate.R3}
        R4={pathUpdate.R4}
        predecessorLabel={predecessorLabel}
        successorLabel={successorLabel}
        removedStateLabel={removedStateLabel}
      />

      {/* User input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-gray-600">
          Enter the resulting expression (do not include the grey brackets shown
          in formula):
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              if (hasSubmitted) setHasSubmitted(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && userInput.trim()) handleCheck();
            }}
            placeholder="e.g., a+bc*d"
            className={`flex-1 rounded border px-2 py-1.5 font-mono text-sm outline-none transition-colors ${
              hasSubmitted
                ? isCorrect
                  ? "border-green-400 bg-green-50"
                  : "border-red-400 bg-red-50"
                : "border-gray-300 focus:border-blue-500"
            }`}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleCheck}
            disabled={!userInput.trim() || (hasSubmitted && isCorrect === true)}
          >
            Check Answer
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAutoComplete}
            disabled={hasSubmitted && isCorrect === true}
          >
            Auto-complete
          </Button>
        </div>

        {/* Feedback */}
        {hasSubmitted && isCorrect === true && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded bg-green-50 border border-green-200 px-3 py-2"
          >
            <span className="text-green-600 text-lg">✓</span>
            <span className="text-sm text-green-700">Correct!</span>
          </motion.div>
        )}

        {hasSubmitted && isCorrect === false && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="flex flex-col gap-1 rounded bg-red-50 border border-red-200 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-red-600 text-lg">✗</span>
              <span className="text-sm text-red-700">
                Not quite. Try again or view the answer.
              </span>
            </div>
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="text-xs text-red-500 hover:text-red-700 underline cursor-pointer text-left"
            >
              {showAnswer ? "Hide answer" : "Show answer"}
            </button>
            {showAnswer && (
              <p className="font-mono text-sm text-red-800 bg-red-100 rounded px-2 py-1">
                {pathUpdate.expectedResult}
              </p>
            )}
          </motion.div>
        )}

        {/* Next button */}
        {hasSubmitted && isCorrect === true && (
          <Button onClick={handleNext} className="w-full">
            Next Path →
          </Button>
        )}
      </div>
    </div>
  );
}
