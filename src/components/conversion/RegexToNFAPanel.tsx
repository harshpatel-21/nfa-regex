/**
 * AI assistance was used mainly for styling in this component
 * (visual presentation, class tuning, and UI polish).
 */
import { useState } from "react";
import { useThompson } from "../../hooks/useThompson";
import type { ThompsonTemplate } from "../../core/types";
import { Button } from "../common/Button";
import { regexExamples } from "../../data/regexExamples";

// ---- Regex span highlighter ----

/** Render the full regex string with the current sub-expression highlighted in amber. */
function RegexHighlight({
  regex,
  start,
  end,
}: {
  regex: string;
  start: number;
  end: number;
}) {
  const before = regex.slice(0, start);
  const match = regex.slice(start, end + 1);
  const after = regex.slice(end + 1);
  return (
    <span className="font-mono text-sm tracking-wide">
      <span className="text-gray-500">{before}</span>
      <span className="rounded bg-amber-200 px-0.5 font-semibold text-amber-900">
        {match}
      </span>
      <span className="text-gray-500">{after}</span>
    </span>
  );
}

/** Serialize the final NFA to JSON and trigger a browser file download. */
export function exportFinalNFA(finalStep?: {
  nfaAfter: { states: unknown[]; transitions: unknown[] };
}) {
  if (!finalStep) return;
  const json = JSON.stringify(finalStep.nfaAfter, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nfa.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Template option labels ----

const TEMPLATE_LABELS: Record<
  ThompsonTemplate,
  { label: string; description: string }
> = {
  symbol: {
    label: "Base — symbol",
    description: "A single character (e.g. a, b, 0)",
  },
  epsilon: { label: "Base — ε", description: "The empty string ε" },
  union: {
    label: "Union  (r₁ + r₂)",
    description: "Choice between two sub-expressions",
  },
  concat: {
    label: "Concatenation  (r₁r₂)",
    description: "One sub-expression followed by another",
  },
  star: { label: "Kleene Star  (r*)", description: "Zero or more repetitions" },
};

const ALL_TEMPLATES: ThompsonTemplate[] = [
  "symbol",
  "epsilon",
  "union",
  "concat",
  "star",
];

// ---- Transition table display ----

/** Render the list of transitions added in the current Thompson step as a small from/symbol/to table. */
function TransitionTable({
  rows,
}: {
  rows: { sourceLabel: string; symbol: string; targetLabel: string }[];
}) {
  return (
    <table className="w-full text-xs font-mono border-collapse">
      <thead>
        <tr className="text-gray-500 text-left">
          <th className="pb-1 pr-3">From</th>
          <th className="pb-1 pr-3">Symbol</th>
          <th className="pb-1">To</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-t border-gray-100">
            <td className="py-0.5 pr-3 text-amber-700 font-semibold">
              {row.sourceLabel}
            </td>
            <td className="py-0.5 pr-3 text-blue-700">{row.symbol}</td>
            <td className="py-0.5 text-amber-700 font-semibold">
              {row.targetLabel}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---- Main panel ----

/**
 * Sidebar panel for Thompson's Construction.
 * Handles regex input, step-by-step template identification, and completion/export.
 */
export function RegexToNFAPanel() {
  const {
    phase,
    regex,
    steps,
    currentStepIndex,
    currentStep,
    userTemplate,
    isTemplateCorrect,
    error,
    startConstruction,
    selectTemplate,
    nextStep,
    autoStep,
    reset,
  } = useThompson();

  const [localRegex, setLocalRegex] = useState("");
  const [showExamples, setShowExamples] = useState(false);

  // start the construction process with the provided regex
  const handleStart = () => {
    if (localRegex.trim()) startConstruction(localRegex.trim());
  };

  // stop construction and reset local input state, but keep the same regex in case user wants to review steps or export final NFA
  const handleReset = () => {
    reset();
    setLocalRegex("");
  };

  // ---- Idle / input phase ----
  if (phase === "idle") {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Thompson's Construction
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowExamples(!showExamples)}
          >
            {showExamples ? "Hide" : "Load"} Examples
          </Button>
        </div>

        {showExamples && (
          <div className="flex flex-col gap-1 rounded border border-gray-200 bg-gray-50 p-2">
            {regexExamples.map((ex) => (
              <button
                key={ex.name}
                onClick={() => {
                  setLocalRegex(ex.regex);
                  setShowExamples(false);
                }}
                className="flex flex-col rounded px-2 py-1.5 text-left hover:bg-white transition-colors cursor-pointer"
              >
                <span className="text-xs font-medium text-gray-700">
                  {ex.name}{" "}
                  <span className="font-mono text-amber-700">{ex.regex}</span>
                </span>
                <span className="text-[10px] text-gray-500">
                  {ex.description}
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Convert a regular expression to an NFA step by step using Thompson's
          Construction. At each step, identify which template applies.
        </p>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-600">
            Regular expression
          </label>
          <input
            type="text"
            value={localRegex}
            onChange={(e) => setLocalRegex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && localRegex.trim()) handleStart();
            }}
            placeholder="e.g. (a+b)*c"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-blue-400 focus:outline-none"
          />
          <p className="text-xs text-gray-400">
            Operators: <span className="font-mono">+</span> (union),{" "}
            <span className="font-mono">*</span> (Kleene star), implicit
            concatenation, <span className="font-mono">( )</span> grouping,{" "}
            <span className="font-mono">ε</span>
          </p>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <Button onClick={handleStart} disabled={!localRegex.trim()}>
          Start Construction
        </Button>
      </div>
    );
  }

  // ---- Complete phase ----
  if (phase === "complete") {
    const finalStep = steps[steps.length - 1];

    const handleExportFinal = () => exportFinalNFA(finalStep);

    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Thompson's Construction
          </h2>
          <Button size="sm" variant="ghost" onClick={handleReset}>
            ← Reset
          </Button>
        </div>

        <div className="rounded border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-xs font-medium text-green-700 mb-1">
            Construction complete!
          </p>
          <p className="text-sm font-mono text-green-900 font-semibold">
            {regex}
          </p>
        </div>

        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          <p className="font-medium mb-1">
            NFA built in {steps.length} step{steps.length !== 1 ? "s" : ""}.
          </p>
          <p>
            States: {finalStep?.nfaAfter.states.length ?? 0} &nbsp;·&nbsp;
            Transitions: {finalStep?.nfaAfter.transitions.length ?? 0}
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleExportFinal}
          disabled={!finalStep}
        >
          ↓ Export Final NFA
        </Button>
      </div>
    );
  }

  // ---- Stepping phase ----
  if (!currentStep) return null;

  const stepNumber = currentStepIndex + 1;
  const totalSteps = steps.length;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          Thompson's Construction
        </h2>
        <Button size="sm" variant="ghost" onClick={handleReset}>
          ← Reset
        </Button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-full bg-gray-200 h-1.5">
          <div
            className="rounded-full bg-blue-500 h-1.5 transition-all"
            style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 shrink-0">
          {stepNumber} / {totalSteps}
        </span>
      </div>

      {/* Current sub-expression highlighted in the regex */}
      <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
        <p className="text-xs text-gray-500 mb-1">Current sub-expression:</p>
        <RegexHighlight
          regex={regex}
          start={currentStep.subExprStart}
          end={currentStep.subExprEnd}
        />
      </div>

      {/* Template selection */}
      {isTemplateCorrect !== true && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-700">
            Which Thompson template applies to{" "}
            <span className="font-mono font-semibold text-amber-700">
              {currentStep.subExpr}
            </span>
            ?
          </p>
          <div className="flex flex-col gap-1">
            {ALL_TEMPLATES.map((t) => {
              const isSelected = userTemplate === t;
              const isWrong = isSelected && isTemplateCorrect === false;
              return (
                <button
                  key={t}
                  onClick={() => selectTemplate(t)}
                  className={`flex items-start gap-2 rounded border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                    isWrong
                      ? "border-red-300 bg-red-50 text-red-700"
                      : isSelected
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {isWrong ? "✗" : isSelected ? "○" : "○"}
                  </span>
                  <span>
                    <span className="font-medium">
                      {TEMPLATE_LABELS[t].label}
                    </span>
                    <span className="block text-gray-400 text-[10px]">
                      {TEMPLATE_LABELS[t].description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {isTemplateCorrect === false && (
            <p className="text-xs text-red-600">
              Not quite — look at the highlighted sub-expression and try again.
            </p>
          )}

          <button
            onClick={autoStep}
            className="text-xs text-gray-400 hover:text-gray-600 underline text-left cursor-pointer"
          >
            Skip — show me the answer
          </button>
        </div>
      )}

      {/* Result: show after correct template selected */}
      {isTemplateCorrect === true && (
        <div className="flex flex-col gap-3">
          <div className="rounded border border-green-200 bg-green-50 px-3 py-2">
            <p className="text-xs font-medium text-green-700">
              ✓ Correct — {TEMPLATE_LABELS[currentStep.template].label}
            </p>
          </div>

          <div className="rounded border border-blue-100 bg-blue-50 px-3 py-2">
            <p className="text-xs text-blue-700">{currentStep.explanation}</p>
          </div>

          {/* New transitions added */}
          {currentStep.expectedTransitions.length > 0 && (
            <div className="rounded border border-amber-100 bg-amber-50 px-3 py-2">
              <p className="text-xs font-medium text-amber-800 mb-2">
                New transitions added
                {currentStep.newStateIds.length > 0
                  ? ` (states ${currentStep.newStateIds
                      .map(
                        (id) =>
                          currentStep.nfaAfter.states.find((s) => s.id === id)
                            ?.label ?? id,
                      )
                      .join(", ")} highlighted in graph)`
                  : ""}
                :
              </p>
              <TransitionTable rows={currentStep.expectedTransitions} />
            </div>
          )}

          {stepNumber < totalSteps ? (
            <Button onClick={nextStep}>Next Step →</Button>
          ) : (
            <Button onClick={nextStep}>Finish Construction</Button>
          )}
        </div>
      )}
    </div>
  );
}
