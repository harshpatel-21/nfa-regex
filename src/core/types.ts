export type StateId = string
export type TransitionId = string

export interface State {
  id: StateId
  label: string
  isStart: boolean
  isFinal: boolean
}

export interface Transition {
  id: TransitionId
  source: StateId
  target: StateId
  symbol: string
}

export interface NFA {
  states: State[]
  transitions: Transition[]
  alphabet: string[]
}

export interface GTG {
  states: State[]
  transitions: Transition[]
  alphabet: string[]
}

export interface PathUpdate {
  from: StateId
  to: StateId
  R1: string
  R2: string
  R3: string
  R4: string
  expectedResult: string
  userInput?: string
  isCorrect?: boolean
}

export interface EliminationStep {
  type: 'preprocess' | 'eliminate' | 'extract' | 'revert'
  stateToRemove?: StateId
  affectedPaths: PathUpdate[]
  explanation: string
  gtgBefore: GTG
  gtgAfter: GTG
}

export type AppMode = 'nfa-to-regex' | 'regex-to-nfa'

export type NFAToRegexPhase = 'input' | 'converting'

export type ConversionPhase =
  | 'idle'
  | 'preprocessing'
  | 'selecting-state'
  | 'updating-paths'
  | 'step-complete'
  | 'finished'

export interface ValidationError {
  field: string
  message: string
}

export const EPSILON = 'ε'
export const EMPTY_SET = '∅'

// ---- Thompson's Construction types ----

export type ThompsonTemplate = 'symbol' | 'epsilon' | 'union' | 'concat' | 'star'

export interface ThompsonTransitionRow {
  id: string
  sourceLabel: string
  symbol: string
  targetLabel: string
}

export interface ThompsonStep {
  id: string
  template: ThompsonTemplate
  subExprStart: number
  subExprEnd: number // inclusive
  subExpr: string
  fragmentStartId: string
  fragmentFinalId: string
  newStateIds: string[]
  newTransitionIds: string[]
  nfaAfter: NFA
  explanation: string
  expectedTransitions: ThompsonTransitionRow[]
}

export type ThompsonPhase = 'idle' | 'stepping' | 'complete'
