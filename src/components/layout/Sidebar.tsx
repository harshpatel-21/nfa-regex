import { useAppContext } from '../../hooks/useAppContext';
import { NFAInputPanel } from '../nfa-input/NFAInputPanel';
import { ConversionPanel } from '../conversion/ConversionPanel';

export function Sidebar() {
  const { state } = useAppContext();

  return (
    <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-4 shrink-0">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          {state.mode === 'input' ? 'NFA Definition' : 'Conversion Steps'}
        </h2>
      </div>
      {state.mode === 'input' ? <NFAInputPanel /> : <ConversionPanel />}
    </aside>
  );
}
