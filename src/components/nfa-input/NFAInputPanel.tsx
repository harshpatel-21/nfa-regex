import { useState } from 'react'
import { useNFA } from '../../hooks/useNFA'
import { useConversion } from '../../hooks/useConversion'
import { useNotification } from '../layout/NotificationArea'
import { TransitionTable } from './TransitionTable'
import { Button } from '../common/Button'
import { examples } from '../../data/examples'
import { EPSILON } from '../../core/types'

export function NFAInputPanel() {
  const {
    nfa,
    validationErrors,
    validate,
    loadNFA,
    addState,
    removeState,
    updateState,
    addSymbolToAlphabet,
    removeSymbolFromAlphabet,
    selectedStateId,
    resetNFA,
  } = useNFA()
  const { startConversion } = useConversion()
  const { notify } = useNotification()
  const [showExamples, setShowExamples] = useState(false)
  const [newSymbol, setNewSymbol] = useState('')

  const handleStartConversion = () => {
    const errors = validate()
    if (errors.length > 0) {
      notify(errors[0]?.message ?? 'Validation failed', 'error')
      return
    }
    startConversion()
    notify('Conversion started — preprocessing complete', 'success')
  }

  const handleAddSymbol = () => {
    const sym = newSymbol.trim()
    if (sym && sym !== EPSILON && !nfa.alphabet.includes(sym)) {
      addSymbolToAlphabet(sym)
      setNewSymbol('')
    }
  }

  const selectedState = nfa.states.find((s) => s.id === selectedStateId)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between pr-8">
        <h2 className="text-sm font-semibold text-gray-700">NFA Input</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowExamples(!showExamples)}
        >
          {showExamples ? 'Hide' : 'Load'} Examples
        </Button>
      </div>

      {/* Keyboard shortcuts hint
      <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded text-xs text-gray-600">
        <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Tip: Use <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">⌘N</kbd> to add state, <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">Del</kbd> to remove</span>
      </div> */}

      {showExamples && (
        <div className="flex flex-col gap-1 rounded border border-gray-200 bg-gray-50 p-2">
          {examples.map((ex) => (
            <button
              key={ex.name}
              onClick={() => {
                loadNFA(ex.nfa)
                setShowExamples(false)
                notify(`Loaded: ${ex.name}`, 'success')
              }}
              className="flex flex-col rounded px-2 py-1.5 text-left hover:bg-white transition-colors cursor-pointer"
            >
              <span className="text-xs font-medium text-gray-700">
                {ex.name}
              </span>
              <span className="text-[10px] text-gray-500">
                {ex.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Alphabet/Symbol Controls */}
      <div className="flex flex-col gap-2 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
            placeholder="Add symbol (a-z, 0-9...)"
            maxLength={1}
            className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-mono hover:bg-gray-200 transition-colors"
              >
                {sym}
                <button
                  onClick={() => removeSymbolFromAlphabet(sym)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer"
                  title="Remove symbol"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* State Controls - Above Table */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => addState()}
              title="Add new state (⌘N)"
            >
              + State
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={!selectedStateId}
              onClick={() => selectedStateId && removeState(selectedStateId)}
              title={selectedStateId ? 'Remove selected state (Delete)' : 'Select a state first'}
            >
              - State
            </Button>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={resetNFA} 
            title="Clear all states and symbols"
          >
            Clear All
          </Button>
        </div>

        {selectedState && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs">
            <span className="font-medium text-gray-600">Selected: {selectedState.label}</span>
            <div className="flex gap-1 ml-auto">
              <Button
                size="sm"
                variant={selectedState.isStart ? 'primary' : 'secondary'}
                onClick={() =>
                  updateState(selectedState.id, {
                    isStart: !selectedState.isStart,
                  })
                }
              >
                {selectedState.isStart ? '★ Start' : 'Set Start'}
              </Button>
              <Button
                size="sm"
                variant={selectedState.isFinal ? 'primary' : 'secondary'}
                onClick={() =>
                  updateState(selectedState.id, {
                    isFinal: !selectedState.isFinal,
                  })
                }
              >
                {selectedState.isFinal ? '◉ Final' : 'Set Final'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transition Table */}
      <TransitionTable />

      {validationErrors.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-2">
          {validationErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-600">
              {err.message}
            </p>
          ))}
        </div>
      )}
      <Button
        onClick={handleStartConversion}
        disabled={nfa.states.length === 0}
        className="w-full"
        title="Convert NFA to Regular Expression (⌘Enter)"
      >
        Convert to Regex
      </Button>
    </div>
  )
}
