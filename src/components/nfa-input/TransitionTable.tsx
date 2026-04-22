/**
 * AI assistance was used mainly for styling in this component
 * (visual presentation, class tuning, and UI polish).
 */
import { useState } from "react";
import { useNFA } from "../../hooks/useNFA";
import { useAppContext } from "../../state/AppContext";
import { EPSILON } from "../../core/types";
import type { StateId } from "../../core/types";

/**
 * Render the NFA transition table. Rows are states, columns are alphabet symbols plus ε.
 * Clicking a row selects the state; cells allow adding and removing individual transitions.
 */
export function TransitionTable() {
  const { nfa, selectedStateId, addTransition, removeTransition, updateState } =
    useNFA();
  const { nfaDispatch } = useAppContext();

  const columns = [...nfa.alphabet, EPSILON];

  /** Return all transitions from a given state on a given symbol. */
  const getTargets = (stateId: StateId, symbol: string) => {
    return nfa.transitions.filter(
      (t) => t.source === stateId && t.symbol === symbol,
    );
  };

  if (nfa.states.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">
        Add states and symbols to build the transition table.
      </p>
    );
  }

  if (columns.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">
        Add at least one alphabet symbol.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">
              State
            </th>
            {columns.map((sym) => (
              <th
                key={sym}
                className="border border-gray-200 px-2 py-1 text-center font-mono font-medium text-gray-600"
              >
                {sym}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nfa.states.map((state) => (
            <tr
              key={state.id}
              className={`cursor-pointer ${state.id === selectedStateId ? "bg-blue-50" : "hover:bg-gray-50"}`}
              onClick={() =>
                nfaDispatch({ type: "SELECT_STATE", payload: state.id })
              }
            >
              <td className="border border-gray-200 px-2 py-1 font-mono">
                <div className="flex items-center gap-1">
                  {state.isStart && (
                    <span className="text-green-600" title="Start state">
                      →
                    </span>
                  )}
                  {state.isFinal && (
                    <span className="text-purple-600" title="Final state">
                      ◉
                    </span>
                  )}
                  <EditableLabel
                    value={state.label}
                    onChange={(newLabel) =>
                      updateState(state.id, { label: newLabel })
                    }
                  />
                </div>
              </td>
              {columns.map((symbol) => (
                <TransitionCell
                  key={symbol}
                  targets={getTargets(state.id, symbol)}
                  allStates={nfa.states}
                  onAdd={(targetId) =>
                    addTransition(state.id, targetId, symbol)
                  }
                  onRemove={removeTransition}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TransitionCellProps {
  targets: { id: string; target: string }[];
  allStates: { id: string; label: string }[];
  onAdd: (targetId: string) => void;
  onRemove: (transitionId: string) => void;
}

/** Table cell showing the target states for one (source, symbol) pair with add/remove controls. */
function TransitionCell({
  targets,
  allStates,
  onAdd,
  onRemove,
}: TransitionCellProps) {
  const [isAdding, setIsAdding] = useState(false);

  const targetLabels = targets.map((t) => {
    const state = allStates.find((s) => s.id === t.target);
    return { transitionId: t.id, label: state?.label ?? t.target };
  });

  return (
    <td className="border border-gray-200 px-2 py-1 text-center">
      <div className="flex flex-wrap items-center justify-center gap-1">
        {targetLabels.map((t) => (
          <span
            key={t.transitionId}
            className="inline-flex items-center gap-0.5 rounded bg-blue-100 px-1.5 py-0.5 font-mono text-blue-800"
          >
            {t.label}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(t.transitionId);
              }}
              className="text-blue-400 hover:text-red-500 cursor-pointer"
            >
              ×
            </button>
          </span>
        ))}
        {isAdding ? (
          <select
            autoFocus
            className="text-xs border rounded px-1 py-0.5"
            onChange={(e) => {
              if (e.target.value) {
                onAdd(e.target.value);
              }
              setIsAdding(false);
            }}
            onBlur={() => setIsAdding(false)}
            defaultValue=""
          >
            <option value="" disabled>
              select
            </option>
            {allStates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
            className="text-gray-300 hover:text-blue-500 cursor-pointer text-sm"
            title="Add transition"
          >
            +
          </button>
        )}
      </div>
    </td>
  );
}

/** Inline-editable state label; double-click to edit, blur or Enter to confirm. */
function EditableLabel({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (isEditing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft.trim()) onChange(draft.trim());
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (draft.trim()) onChange(draft.trim());
            setIsEditing(false);
          }
          if (e.key === "Escape") setIsEditing(false);
        }}
        autoFocus
        className="w-12 border-b border-blue-400 bg-transparent text-xs outline-none"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className="cursor-text hover:text-blue-600"
      onDoubleClick={(e) => {
        e.stopPropagation();
        setDraft(value);
        setIsEditing(true);
      }}
    >
      {value}
    </span>
  );
}
