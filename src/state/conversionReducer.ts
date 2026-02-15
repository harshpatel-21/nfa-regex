import type {
  GTG,
  EliminationStep,
  PathUpdate,
  ConversionPhase,
  StateId,
} from '../core/types'
import { validateUserRegex } from '../core/validation'

export interface ConversionState {
  phase: ConversionPhase
  gtg: GTG | null
  history: EliminationStep[]
  currentStepIndex: number
  stateToRemove: StateId | null
  currentPathUpdates: PathUpdate[]
  currentPathIndex: number
  finalRegex: string | null
  highlightedR: 'R1' | 'R2' | 'R3' | 'R4' | null
}

export type ConversionAction =
  | { type: 'START_CONVERSION'; payload: GTG }
  | { type: 'SET_PHASE'; payload: ConversionPhase }
  | { type: 'PREPROCESS_COMPLETE'; payload: { gtg: GTG; step: EliminationStep } }
  | { type: 'SELECT_STATE_TO_REMOVE'; payload: StateId }
  | { type: 'SET_PATH_UPDATES'; payload: PathUpdate[] }
  | { type: 'SUBMIT_PATH_ANSWER'; payload: { pathIndex: number; userInput: string } }
  | { type: 'ADVANCE_PATH' }
  | { type: 'COMPLETE_ELIMINATION'; payload: { gtg: GTG; step: EliminationStep } }
  | { type: 'EXTRACT_RESULT'; payload: { regex: string; step: EliminationStep } }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'AUTO_COMPLETE_PATH'; payload: number }
  | { type: 'SET_HIGHLIGHTED_R'; payload: 'R1' | 'R2' | 'R3' | 'R4' | null }
  | { type: 'RESET_CONVERSION' }

export const initialConversionState: ConversionState = {
  phase: 'idle',
  gtg: null,
  history: [],
  currentStepIndex: -1,
  stateToRemove: null,
  currentPathUpdates: [],
  currentPathIndex: 0,
  finalRegex: null,
  highlightedR: null,
}

export function conversionReducer(
  state: ConversionState,
  action: ConversionAction
): ConversionState {
  switch (action.type) {
    case 'START_CONVERSION':
      return {
        ...initialConversionState,
        phase: 'preprocessing',
        gtg: action.payload,
      }

    case 'SET_PHASE':
      return { ...state, phase: action.payload }

    case 'PREPROCESS_COMPLETE':
      return {
        ...state,
        phase: 'selecting-state',
        gtg: action.payload.gtg,
        history: [...state.history, action.payload.step],
        currentStepIndex: state.history.length,
      }

    case 'SELECT_STATE_TO_REMOVE':
      return {
        ...state,
        stateToRemove: action.payload,
      }

    case 'SET_PATH_UPDATES':
      // If there are no path updates (unreachable state), skip directly to step-complete
      if (action.payload.length === 0) {
        return {
          ...state,
          phase: 'step-complete',
          currentPathUpdates: [],
          currentPathIndex: 0,
        }
      }
      return {
        ...state,
        phase: 'updating-paths',
        currentPathUpdates: action.payload,
        currentPathIndex: 0,
      }

    case 'SUBMIT_PATH_ANSWER': {
      const { pathIndex, userInput } = action.payload
      const updatedPaths = state.currentPathUpdates.map((p, i) => {
        if (i !== pathIndex) return p
        const isCorrect = validateUserRegex(userInput, p.expectedResult)
        return { ...p, userInput, isCorrect }
      })
      return {
        ...state,
        currentPathUpdates: updatedPaths,
      }
    }

    case 'ADVANCE_PATH': {
      const nextIndex = state.currentPathIndex + 1
      if (nextIndex >= state.currentPathUpdates.length) {
        return { ...state, phase: 'step-complete' }
      }
      return { ...state, currentPathIndex: nextIndex }
    }

    case 'AUTO_COMPLETE_PATH': {
      const updatedPaths = state.currentPathUpdates.map((p, i) => {
        if (i !== action.payload) return p
        return { ...p, userInput: p.expectedResult, isCorrect: true }
      })
      return { ...state, currentPathUpdates: updatedPaths }
    }

    case 'COMPLETE_ELIMINATION':
      return {
        ...state,
        phase: 'selecting-state',
        gtg: action.payload.gtg,
        history: [...state.history, action.payload.step],
        currentStepIndex: state.history.length,
        stateToRemove: null,
        currentPathUpdates: [],
        currentPathIndex: 0,
      }

    case 'EXTRACT_RESULT':
      return {
        ...state,
        phase: 'finished',
        finalRegex: action.payload.regex,
        history: [...state.history, action.payload.step],
        currentStepIndex: state.history.length,
      }

    case 'GO_TO_STEP': {
      const step = state.history[action.payload]
      if (!step) return state
      return {
        ...state,
        currentStepIndex: action.payload,
      }
    }

    case 'SET_HIGHLIGHTED_R':
      return { ...state, highlightedR: action.payload }

    case 'RESET_CONVERSION':
      return { ...initialConversionState }

    default:
      return state
  }
}
