import { useConversion } from '../../hooks/useConversion';
import { useAppContext } from '../../state/AppContext';
import { getEliminatableStates } from '../../core/nfa';

export function StateSelector() {
  const { state } = useAppContext();
  const { conversion, selectState } = useConversion();

  if (!conversion.gtg) return null;

  const eliminatable = getEliminatableStates(conversion.gtg);

  if (eliminatable.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">No more states to eliminate.</p>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Select state to eliminate:
      </label>
      <div className="flex gap-2 flex-wrap">
        {eliminatable.map(s => (
          <button
            key={s.id}
            onClick={() => selectState(s.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              conversion.selectedStateId === s.id
                ? 'bg-red-100 text-red-700 border-2 border-red-400'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
