/**
 * AI assistance was used mainly for styling in this component
 * (visual presentation, class tuning, and UI polish).
 */
import { useStateElimination } from "../../hooks/useStateElimination";
import { StateSelector } from "./StateSelector";
import { PathUpdateForm } from "./PathUpdateForm";
import { Button } from "../common/Button";

/**
 * Sidebar panel driving the NFA→Regex state elimination flow.
 * Switches between state selection, path-update input, step-complete confirmation, and finished phases.
 */
export function StateEliminationPanel() {
  const {
    phase,
    finalRegex,
    history,
    currentStepIndex,
    currentPathUpdates,
    currentPathIndex,
    stateToRemove,
    gtg,
    completeElimination,
    revertElimination,
    backToStateSelection,
    resetConversion,
  } = useStateElimination();

  const canRevert = history.some((s) => s.type === "eliminate");

  const currentStep = history[currentStepIndex];
  const removedStateLabel =
    stateToRemove && gtg
      ? (gtg.states.find((s) => s.id === stateToRemove)?.label ?? "")
      : "";

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          State Elimination
        </h2>
        {phase === "selecting-state" ||
        phase === "preprocessing" ||
        phase === "finished" ? (
          <Button
            size="sm"
            className="pr-8"
            variant="ghost"
            onClick={resetConversion}
          >
            ← Back to Input
          </Button>
        ) : (
          <Button
            size="sm"
            className="pr-8"
            variant="ghost"
            onClick={backToStateSelection}
          >
            ← Back
          </Button>
        )}
      </div>

      {/* Step explanation */}
      {currentStep && (
        <div className="rounded border border-blue-100 bg-blue-50 p-2">
          <p className="text-xs text-blue-700">{currentStep.explanation}</p>
        </div>
      )}

      {/* Phase-dependent content */}
      {phase === "preprocessing" && (
        <p className="text-sm text-gray-500">Preprocessing...</p>
      )}

      {phase === "selecting-state" && (
        <>
          <StateSelector />
          {canRevert && (
            <Button size="sm" variant="secondary" onClick={revertElimination}>
              Revert Last Elimination
            </Button>
          )}
        </>
      )}

      {phase === "updating-paths" && (
        <div className="flex flex-col gap-3">
          <div className="rounded bg-orange-50 border border-orange-200 px-3 py-2">
            <p className="text-xs font-medium text-orange-800">
              Eliminating state:{" "}
              <span className="font-mono">{removedStateLabel}</span>
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Path {currentPathIndex + 1} of {currentPathUpdates.length}
            </p>
          </div>

          {/* Path list showing all paths to be created */}
          <div className="rounded border border-gray-200 bg-gray-50 p-2">
            <p className="text-xs font-medium text-gray-600 mb-2">
              New paths to create:
            </p>
            <div className="flex flex-col gap-1">
              {currentPathUpdates.map((path, idx) => {
                const fromLabel =
                  gtg?.states.find((s) => s.id === path.from)?.label ??
                  path.from;
                const toLabel =
                  gtg?.states.find((s) => s.id === path.to)?.label ?? path.to;
                const isCompleted = idx < currentPathIndex;
                const isCurrent = idx === currentPathIndex;
                const isPending = idx > currentPathIndex;

                return (
                  <div
                    key={`${path.from}-${path.to}`}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono transition-colors ${
                      isCurrent
                        ? "bg-orange-100 border border-orange-300 text-orange-800"
                        : isCompleted
                          ? "bg-green-50 text-green-700"
                          : "text-gray-500"
                    }`}
                  >
                    <span className="w-4 text-center">
                      {isCompleted && <span className="text-green-600">✓</span>}
                      {isCurrent && <span className="text-orange-600">○</span>}
                      {isPending && <span className="text-gray-400">○</span>}
                    </span>
                    <span className={isCompleted ? "line-through" : ""}>
                      {fromLabel} → {toLabel}
                    </span>
                    {isCompleted && path.expectedResult && (
                      <span
                        className="text-green-600 ml-auto truncate max-w-[100px]"
                        title={path.expectedResult}
                      >
                        = {path.expectedResult}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {currentPathUpdates[currentPathIndex] && (
            <PathUpdateForm
              pathUpdate={currentPathUpdates[currentPathIndex]}
              pathIndex={currentPathIndex}
              removedStateLabel={removedStateLabel}
              gtg={gtg}
            />
          )}
        </div>
      )}

      {phase === "step-complete" && (
        <div className="flex flex-col gap-3">
          <div className="rounded bg-green-50 border border-green-200 p-3">
            <p className="text-sm text-green-700">
              {currentPathUpdates.length === 0 ? (
                <>
                  State{" "}
                  <span className="font-mono font-semibold">
                    {removedStateLabel}
                  </span>{" "}
                  is unreachable (no incoming paths). It can be removed without
                  affecting the regex.
                </>
              ) : (
                <>
                  All paths updated for state{" "}
                  <span className="font-mono font-semibold">
                    {removedStateLabel}
                  </span>
                  .
                </>
              )}
            </p>
          </div>

          {/* Summary of new paths created */}
          {currentPathUpdates.length > 0 && (
            <div className="rounded border border-gray-200 bg-gray-50 p-2">
              <p className="text-xs font-medium text-gray-600 mb-2">
                New paths created:
              </p>
              <div className="flex flex-col gap-1">
                {currentPathUpdates.map((path) => {
                  const fromLabel =
                    gtg?.states.find((s) => s.id === path.from)?.label ??
                    path.from;
                  const toLabel =
                    gtg?.states.find((s) => s.id === path.to)?.label ?? path.to;
                  return (
                    <div
                      key={`${path.from}-${path.to}`}
                      className="flex items-center gap-2 px-2 py-1 rounded text-xs font-mono bg-green-50 text-green-700"
                    >
                      <span className="w-4 text-center text-green-600">✓</span>
                      <span>
                        {fromLabel} → {toLabel}
                      </span>
                      {path.expectedResult && (
                        <span
                          className="text-green-600 ml-auto truncate max-w-[120px]"
                          title={path.expectedResult}
                        >
                          = {path.expectedResult}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button onClick={completeElimination}>
            Complete Elimination & Continue
          </Button>
        </div>
      )}

      {phase === "finished" && (
        <div className="flex flex-col gap-3">
          <div className="rounded bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-xs text-green-600 mb-1">
              Final Regular Expression
            </p>
            <p className="text-lg font-mono font-bold text-green-800">
              {finalRegex}
            </p>
          </div>
          <Button variant="secondary" onClick={resetConversion}>
            Start Over
          </Button>
        </div>
      )}

      {/* <PlaybackControls /> */}
    </div>
  );
}
