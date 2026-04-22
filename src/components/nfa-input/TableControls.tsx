/**
 * AI assistance was used mainly for styling in this component
 * (visual presentation, class tuning, and UI polish).
 */
import { useState } from "react";
import { useNFA } from "../../hooks/useNFA";
import { Button } from "../common/Button";
import { EPSILON } from "../../core/types";

/** Controls for adding/removing states and alphabet symbols, and toggling start/final on the selected state. */
export function TableControls() {
  const {
    nfa,
    addState,
    removeState,
    updateState,
    addSymbolToAlphabet,
    removeSymbolFromAlphabet,
    selectedStateId,
    resetNFA,
  } = useNFA();
  const [newSymbol, setNewSymbol] = useState("");

  /** Add the typed symbol to the alphabet if it is valid and not already present. */
  const handleAddSymbol = () => {
    const sym = newSymbol.trim();
    if (sym && sym !== EPSILON && !nfa.alphabet.includes(sym)) {
      addSymbolToAlphabet(sym);
      setNewSymbol("");
    }
  };

  const selectedState = nfa.states.find((s) => s.id === selectedStateId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => addState()}>
          + State
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={!selectedStateId}
          onClick={() => selectedStateId && removeState(selectedStateId)}
        >
          - State
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddSymbol()}
          placeholder="Symbol"
          maxLength={1}
          className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <Button size="sm" variant="secondary" onClick={handleAddSymbol}>
          + Symbol
        </Button>
      </div>
      {nfa.alphabet.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {nfa.alphabet.map((sym) => (
            <span
              key={sym}
              className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-mono"
            >
              {sym}
              <button
                onClick={() => removeSymbolFromAlphabet(sym)}
                className="text-gray-400 hover:text-red-500 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {selectedState && (
        <div className="flex items-center gap-2 border-t pt-2">
          <Button
            size="sm"
            variant={selectedState.isStart ? "primary" : "secondary"}
            onClick={() =>
              updateState(selectedState.id, { isStart: !selectedState.isStart })
            }
          >
            {selectedState.isStart ? "★ Start" : "Set Start"}
          </Button>
          <Button
            size="sm"
            variant={selectedState.isFinal ? "primary" : "secondary"}
            onClick={() =>
              updateState(selectedState.id, { isFinal: !selectedState.isFinal })
            }
          >
            {selectedState.isFinal ? "◉ Final" : "Set Final"}
          </Button>
        </div>
      )}
      <div className="border-t pt-2">
        <Button size="sm" variant="ghost" onClick={resetNFA}>
          Clear All
        </Button>
      </div>
    </div>
  );
}
