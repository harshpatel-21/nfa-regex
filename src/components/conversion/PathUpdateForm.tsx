import { useState } from 'react';
import type { PathUpdate } from '../../core/types';
import { validateUserInput } from '../../core/regexUtils';
import { FormulaDisplay } from './FormulaDisplay';

interface PathUpdateFormProps {
  path: PathUpdate;
  pathIndex: number;
  fromLabel: string;
  toLabel: string;
  removedLabel: string;
  onSubmit: (pathIndex: number, input: string) => void;
}

export function PathUpdateForm({
  path,
  pathIndex,
  fromLabel,
  toLabel,
  removedLabel,
  onSubmit,
}: PathUpdateFormProps) {
  const [input, setInput] = useState(path.userInput ?? '');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const handleSubmit = () => {
    const isCorrect = validateUserInput(input, path.expectedResult);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      onSubmit(pathIndex, input);
    }
  };

  const handleAutoComplete = () => {
    setInput(path.expectedResult);
    setFeedback('correct');
    onSubmit(pathIndex, path.expectedResult);
  };

  return (
    <div className="space-y-3">
      <FormulaDisplay
        path={path}
        fromLabel={fromLabel}
        toLabel={toLabel}
        removedLabel={removedLabel}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          New expression for {fromLabel} → {toLabel}:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              setFeedback(null);
            }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter R₄ + (R₁ · R₂* · R₃)"
            className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Check
          </button>
          <button
            onClick={handleAutoComplete}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            Auto
          </button>
        </div>

        {feedback === 'correct' && (
          <div className="flex items-center gap-1.5 text-green-600 text-sm">
            <span className="text-lg">✓</span>
            <span>Correct!</span>
          </div>
        )}
        {feedback === 'incorrect' && (
          <div className="flex items-center gap-1.5 text-red-600 text-sm">
            <span className="text-lg">✗</span>
            <span>Incorrect. Try again or click Auto to see the answer.</span>
          </div>
        )}
      </div>
    </div>
  );
}
