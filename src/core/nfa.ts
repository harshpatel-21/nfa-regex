import type {
  NFA,
  GTG,
  State,
  Transition,
  StateId,
  TransitionId,
} from "./types";
import { union } from "./regexUtils";

let stateCounter = 0;
let transitionCounter = 0;

export function generateStateId(): StateId {
  return `s_${stateCounter++}`;
}

export function generateTransitionId(): TransitionId {
  return `t_${transitionCounter++}`;
}

export function resetCounters(): void {
  stateCounter = 0;
  transitionCounter = 0;
}

export function addState(nfa: NFA, state: State): NFA {
  return { ...nfa, states: [...nfa.states, state] };
}

export function removeState(nfa: NFA, stateId: StateId): NFA {
  return {
    ...nfa,
    states: nfa.states.filter((s) => s.id !== stateId),
    transitions: nfa.transitions.filter(
      (t) => t.source !== stateId && t.target !== stateId,
    ),
  };
}

export function updateState(
  nfa: NFA,
  stateId: StateId,
  stateUpdates: Partial<State>,
): NFA {
  return {
    ...nfa,
    states: nfa.states.map((s) =>
      s.id === stateId ? { ...s, ...stateUpdates } : s,
    ),
  };
}

export function addTransition(nfa: NFA, transition: Transition): NFA {
  return { ...nfa, transitions: [...nfa.transitions, transition] };
}

export function removeTransition(nfa: NFA, transitionId: TransitionId): NFA {
  return {
    ...nfa,
    transitions: nfa.transitions.filter((t) => t.id !== transitionId),
  };
}

export function updateTransition(
  nfa: NFA,
  transitionId: TransitionId,
  updates: Partial<Transition>,
): NFA {
  return {
    ...nfa,
    transitions: nfa.transitions.map((t) =>
      t.id === transitionId ? { ...t, ...updates } : t,
    ),
  };
}

export function getOutgoingTransitions(
  nfa: NFA,
  stateId: StateId,
): Transition[] {
  return nfa.transitions.filter((t) => t.source === stateId);
}

export function getIncomingTransitions(
  nfa: NFA,
  stateId: StateId,
): Transition[] {
  return nfa.transitions.filter((t) => t.target === stateId);
}

export function getSelfLoops(nfa: NFA, stateId: StateId): Transition[] {
  return nfa.transitions.filter(
    (t) => t.source === stateId && t.target === stateId,
  );
}

/**
 * Find the transition between two states (if any).
 */
export function getTransitionBetween(
  nfa: NFA,
  from: StateId,
  to: StateId,
): Transition | undefined {
  return nfa.transitions.find((t) => t.source === from && t.target === to);
}

/**
 * Convert NFA to GTG by merging parallel transitions into union regex.
 * Multiple transitions between the same (source, target) pair become
 * a single transition whose symbol is the union of original symbols.
 */
export function nfaToGTG(nfa: NFA): GTG {
  const edgeMap = new Map<string, string[]>();

  for (const t of nfa.transitions) {
    const key = `${t.source}|${t.target}`;
    const existing = edgeMap.get(key);
    if (existing) {
      existing.push(t.symbol);
    } else {
      edgeMap.set(key, [t.symbol]);
    }
  }

  const mergedTransitions: Transition[] = [];
  for (const [key, symbols] of edgeMap) {
    const [source, target] = key.split("|") as [string, string];
    const mergedSymbol = symbols.reduce((acc, sym) => union(acc, sym));
    mergedTransitions.push({
      id: generateTransitionId(),
      source,
      target,
      symbol: mergedSymbol,
    });
  }

  return {
    states: [...nfa.states],
    transitions: mergedTransitions,
    alphabet: [...nfa.alphabet],
  };
}

/**
 * Create a deep clone of an NFA or GTG.
 */
export function cloneNFA<T extends NFA>(nfa: T): T {
  return {
    ...nfa,
    states: nfa.states.map((s) => ({ ...s })),
    transitions: nfa.transitions.map((t) => ({ ...t })),
    alphabet: [...nfa.alphabet],
  };
}

/** Create an NFA with no states, transitions, or alphabet symbols. */
export function createEmptyNFA(): NFA {
  return {
    states: [],
    transitions: [],
    alphabet: [],
  };
}

/**
 * Generate the next state label (q0, q1, q2, ...).
 */
export function nextStateLabel(existingStates: State[]): string {
  const existingLabels = new Set(existingStates.map((s) => s.label));
  let i = 0;
  while (existingLabels.has(`q${i}`)) {
    i++;
  }
  return `q${i}`;
}
