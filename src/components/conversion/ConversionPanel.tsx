import { useConversion } from '../../hooks/useConversion'
import { StateSelector } from './StateSelector'
import { PathUpdateForm } from './PathUpdateForm'
import { PlaybackControls } from '../common/PlaybackControls'
import { Button } from '../common/Button'

export function ConversionPanel() {
  const {
    phase,
    finalRegex,
    history,
    currentStepIndex,
    currentPathUpdates,
    currentPathIndex,
    stateToRemove,
    gtg,
    completeElimination,
    resetConversion,
  } = useConversion()

  const currentStep = history[currentStepIndex]
  const removedStateLabel =
    stateToRemove && gtg
      ? gtg.states.find((s) => s.id === stateToRemove)?.label ?? ''
      : ''

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          State Elimination
        </h2>
        <Button size="sm" className="pr-8" variant="ghost" onClick={resetConversion}>
          ← Back to Input
        </Button>
      </div>

      {/* Step explanation */}
      {currentStep && (
        <div className="rounded border border-blue-100 bg-blue-50 p-2">
          <p className="text-xs text-blue-700">{currentStep.explanation}</p>
        </div>
      )}

      {/* Phase-dependent content */}
      {phase === 'preprocessing' && (
        <p className="text-sm text-gray-500">Preprocessing...</p>
      )}

      {phase === 'selecting-state' && <StateSelector />}

      {phase === 'updating-paths' && (
        <div className="flex flex-col gap-3">
          <div className="rounded bg-orange-50 border border-orange-200 px-3 py-2">
            <p className="text-xs font-medium text-orange-800">
              Eliminating state: <span className="font-mono">{removedStateLabel}</span>
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Path {currentPathIndex + 1} of {currentPathUpdates.length}
            </p>
          </div>
          {currentPathUpdates[currentPathIndex] && (
            <PathUpdateForm
              pathUpdate={currentPathUpdates[currentPathIndex]}
              pathIndex={currentPathIndex}
              removedStateLabel={removedStateLabel}
              gtg={gtg}
            />
          )}
        </div>
      )}

      {phase === 'step-complete' && (
        <div className="flex flex-col gap-3">
          <div className="rounded bg-green-50 border border-green-200 p-3">
            <p className="text-sm text-green-700">
              All paths updated for state{' '}
              <span className="font-mono font-semibold">{removedStateLabel}</span>.
            </p>
          </div>
          <Button onClick={completeElimination}>
            Complete Elimination & Continue
          </Button>
        </div>
      )}

      {phase === 'finished' && (
        <div className="flex flex-col gap-3">
          <div className="rounded bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-xs text-green-600 mb-1">Final Regular Expression</p>
            <p className="text-lg font-mono font-bold text-green-800">
              {finalRegex}
            </p>
          </div>
          <Button variant="secondary" onClick={resetConversion}>
            Start Over
          </Button>
        </div>
      )}

      <PlaybackControls />
    </div>
  )
}
