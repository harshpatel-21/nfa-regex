/**
 * AI assistance was used mainly for styling in this component
 * (visual presentation, class tuning, and UI polish).
 */
import { useStateElimination } from "../../hooks/useStateElimination";
import { Button } from "../common/Button";

/**
 * Display buttons for each eliminable state and an auto-pick option that selects the state with the fewest transitions.
 */
export function StateSelector() {
  const { eliminableStates, gtg, selectStateToRemove } = useStateElimination();

  if (eliminableStates.length === 0) {
    return (
      <p className="text-sm text-gray-500">No states left to eliminate.</p>
    );
  }

  const handleAutoPick = () => {
    // Pick state with fewest total transitions touching it (in + out, self-loop counted once)
    const best = eliminableStates.reduce((prev, curr) => {
      const count = (s: typeof curr) =>
        (gtg?.transitions ?? []).filter(
          (t) => t.source === s.id || t.target === s.id,
        ).length;
      return count(curr) < count(prev) ? curr : prev;
    });
    selectStateToRemove(best.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-600">
        Select a state to eliminate ({eliminableStates.length} remaining):
      </p>
      <div className="flex flex-wrap gap-2">
        {eliminableStates.map((state) => (
          <button
            key={state.id}
            onClick={() => selectStateToRemove(state.id)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            {state.label}
          </button>
        ))}
      </div>
      <Button size="sm" variant="secondary" onClick={handleAutoPick}>
        Auto-pick
      </Button>
    </div>
  );
}
