import { useConversion } from '../../hooks/useConversion';
import { useAppContext } from '../../state/AppContext';
import { PathUpdateForm } from './PathUpdateForm';
import { motion, AnimatePresence } from 'framer-motion';

export function ConversionPanel() {
  const { state } = useAppContext();
  const { conversion, currentStep, hasNextStep, hasPrevStep, nextStep, prevStep, updateUserInput, reset } = useConversion();

  const getStateLabel = (id: string): string => {
    if (!conversion.gtg) return id;
    return conversion.gtg.states.find(s => s.id === id)?.label ?? id;
  };

  const getRemovedLabel = (): string => {
    if (!currentStep?.stateToRemove) return '?';
    // Look in the step's snapshot since state may already be removed from current gtg
    return currentStep.gtgSnapshot.states.find(s => s.id === currentStep.stateToRemove)?.label ?? '?';
  };

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Step {conversion.currentStepIndex + 1} / {conversion.steps.length}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          conversion.phase === 'complete'
            ? 'bg-green-100 text-green-700'
            : conversion.phase === 'eliminating'
            ? 'bg-orange-100 text-orange-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {conversion.phase}
        </span>
      </div>

      {/* Step explanation */}
      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div
            key={conversion.currentStepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
          >
            <p className="text-sm text-blue-800">{currentStep.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Path updates for elimination steps */}
      {currentStep?.type === 'eliminate' && currentStep.affectedPaths.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">
            Path Updates ({currentStep.affectedPaths.length})
          </h4>
          {currentStep.affectedPaths.map((path, i) => (
            <PathUpdateForm
              key={`${path.from}-${path.to}-${i}`}
              path={path}
              pathIndex={i}
              fromLabel={getStateLabel(path.from)}
              toLabel={getStateLabel(path.to)}
              removedLabel={getRemovedLabel()}
              onSubmit={updateUserInput}
            />
          ))}
        </div>
      )}

      {/* Final regex display */}
      {conversion.phase === 'complete' && conversion.finalRegex && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center"
        >
          <p className="text-xs text-green-600 uppercase tracking-wide font-medium mb-1">
            Final Regular Expression
          </p>
          <p className="text-xl font-mono font-bold text-green-800">
            {conversion.finalRegex}
          </p>
        </motion.div>
      )}

      {/* Navigation controls */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <button
          onClick={prevStep}
          disabled={!hasPrevStep}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={nextStep}
          disabled={!hasNextStep}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>

      <button
        onClick={reset}
        className="w-full px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50 transition-colors"
      >
        Back to Input
      </button>
    </div>
  );
}
