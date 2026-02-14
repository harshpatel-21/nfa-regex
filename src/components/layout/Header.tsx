import { useAppContext } from '../../hooks/useAppContext';

export function Header() {
  const { state } = useAppContext();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-gray-900">NFA → Regex Converter</h1>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
          State Elimination
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            state.mode === 'input'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {state.mode === 'input' ? '📝 Input Mode' : '⚡ Conversion Mode'}
        </span>
      </div>
    </header>
  );
}
