/**
 * AI assistance was used mainly for styling in this component
 * (visual presentation, class tuning, and UI polish).
 */
import { useNFA } from "../../hooks/useNFA";
import type { AppMode } from "../../core/types";

const modes: { value: AppMode; label: string }[] = [
  { value: "nfa-to-regex", label: "NFA → Regex" },
  { value: "regex-to-nfa", label: "Regex → NFA" },
];

export function Header() {
  const { appMode, setAppMode } = useNFA();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
      <h1 className="text-lg font-semibold text-gray-800">
        NFA ↔ Regex Converter
      </h1>
      <div className="flex rounded-md border border-gray-300 overflow-hidden">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setAppMode(mode.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              appMode === mode.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </header>
  );
}
