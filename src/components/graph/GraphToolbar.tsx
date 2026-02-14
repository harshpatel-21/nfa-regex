import { useAppContext } from '../../state/AppContext';
import { useNFA } from '../../hooks/useNFA';

export function GraphToolbar() {
  const { state } = useAppContext();
  const { addState } = useNFA();
  const isInputMode = state.mode === 'input';

  if (!isInputMode) return null;

  const handleAddState = () => {
    const stateCount = state.nfa.states.length;
    const label = `q${stateCount}`;
    const isStart = stateCount === 0;
    addState(label, isStart, false);
  };

  return (
    <div className="absolute top-3 left-3 z-10 flex gap-2">
      <button
        onClick={handleAddState}
        className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
      >
        + Add State
      </button>
    </div>
  );
}
