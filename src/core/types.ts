export interface State {
  id: string;
  label: string;
  isStart: boolean;
  isFinal: boolean;
}

export interface Transition {
  id: string;
  source: string;
  target: string;
  symbol: string;
}

export interface NFA {
  states: State[];
  transitions: Transition[];
  alphabet: string[];
}

export type GTG = NFA;
// Same structure as NFA, but transition symbols can be full regex expressions

export interface PathUpdate {
  from: string;
  to: string;
  R1: string;
  R2: string;
  R3: string;
  R4: string;
  expectedResult: string;
  userInput?: string;
}

export interface EliminationStep {
  type: 'preprocess' | 'eliminate' | 'complete';
  stateToRemove?: string;
  affectedPaths: PathUpdate[];
  explanation: string;
  gtgSnapshot: GTG;
}

export type AppMode = 'input' | 'conversion';

export type ConversionPhase = 'idle' | 'preprocessing' | 'eliminating' | 'complete';
