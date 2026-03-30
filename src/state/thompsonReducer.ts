import type { ThompsonStep, ThompsonPhase, ThompsonTemplate } from '../core/types'
import { buildThompsonSteps } from '../core/thompson'

export interface ThompsonState {
  phase: ThompsonPhase
  regex: string
  steps: ThompsonStep[]
  currentStepIndex: number
  /** Template the user has selected for the current step */
  userTemplate: ThompsonTemplate | null
  /** null = not yet selected, true = correct, false = wrong */
  isTemplateCorrect: boolean | null
  error: string | null
}

export type ThompsonAction =
  | { type: 'SET_REGEX'; payload: string }
  | { type: 'START'; payload: string } // payload = regex to build
  | { type: 'SELECT_TEMPLATE'; payload: ThompsonTemplate }
  | { type: 'NEXT_STEP' }
  | { type: 'AUTO_STEP' }
  | { type: 'RESET' }

export const initialThompsonState: ThompsonState = {
  phase: 'idle',
  regex: '',
  steps: [],
  currentStepIndex: 0,
  userTemplate: null,
  isTemplateCorrect: null,
  error: null,
}

export function thompsonReducer(
  state: ThompsonState,
  action: ThompsonAction
): ThompsonState {
  switch (action.type) {
    case 'SET_REGEX':
      return { ...state, regex: action.payload, error: null }

    case 'START': {
      const { steps, error } = buildThompsonSteps(action.payload)
      if (error || steps.length === 0) {
        return { ...state, error: error ?? 'Could not parse expression' }
      }
      return {
        ...state,
        phase: 'stepping',
        regex: action.payload,
        steps,
        currentStepIndex: 0,
        userTemplate: null,
        isTemplateCorrect: null,
        error: null,
      }
    }

    case 'SELECT_TEMPLATE': {
      const step = state.steps[state.currentStepIndex]
      if (!step) return state
      return {
        ...state,
        userTemplate: action.payload,
        isTemplateCorrect: action.payload === step.template,
      }
    }

    case 'NEXT_STEP': {
      if (state.isTemplateCorrect !== true) return state
      const nextIndex = state.currentStepIndex + 1
      if (nextIndex >= state.steps.length) {
        return { ...state, phase: 'complete' }
      }
      return {
        ...state,
        currentStepIndex: nextIndex,
        userTemplate: null,
        isTemplateCorrect: null,
      }
    }

    case 'AUTO_STEP': {
      // Reveal the correct template for the current step without user having to choose
      const step = state.steps[state.currentStepIndex]
      if (!step) return state
      return {
        ...state,
        userTemplate: step.template,
        isTemplateCorrect: true,
      }
    }

    case 'RESET':
      return { ...initialThompsonState }

    default:
      return state
  }
}
