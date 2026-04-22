import type { GTG, State, StateId, EliminationStep, PathUpdate } from "./types";
import { EPSILON, EMPTY_SET } from "./types";
import {
  cloneNFA,
  generateStateId,
  generateTransitionId,
  getIncomingTransitions,
  getOutgoingTransitions,
  getSelfLoops,
  getTransitionBetween,
} from "./nfa";
import { eliminationFormula, union } from "./regexUtils";

/**
 * Preprocess: add new unique start state S and final state F.
 * - S has epsilon-transition to original start
 * - All original final states get epsilon-transition to F
 * - Original start loses isStart, original finals lose isFinal
 */
export function preprocess(gtg: GTG): { gtg: GTG; step: EliminationStep } {
  const before = cloneNFA(gtg);

  const newStartId = generateStateId();
  const newFinalId = generateStateId();

  const newStart: State = {
    id: newStartId,
    label: "S",
    isStart: true,
    isFinal: false,
  };
  const newFinal: State = {
    id: newFinalId,
    label: "F",
    isStart: false,
    isFinal: true,
  };

  const originalStart = gtg.states.find((s) => s.isStart);
  const originalFinals = gtg.states.filter((s) => s.isFinal);

  // Build new states: new start + new final + originals with flags cleared
  const updatedStates = gtg.states.map((s) => ({
    ...s,
    isStart: false,
    isFinal: false,
  }));

  // Build new transitions
  const newTransitions = [...gtg.transitions];

  // S → original start with ε
  if (originalStart) {
    newTransitions.push({
      id: generateTransitionId(),
      source: newStartId,
      target: originalStart.id,
      symbol: EPSILON,
    });
  }

  // Each original final → F with ε
  for (const finalState of originalFinals) {
    newTransitions.push({
      id: generateTransitionId(),
      source: finalState.id,
      target: newFinalId,
      symbol: EPSILON,
    });
  }

  const after: GTG = {
    states: [newStart, ...updatedStates, newFinal],
    transitions: newTransitions,
    alphabet: [...gtg.alphabet],
  };

  const step: EliminationStep = {
    type: "preprocess",
    affectedPaths: [],
    explanation: `Added new start state S with ε-transition to ${originalStart?.label ?? "?"}, and new final state F with ε-transitions from all original accept states.`,
    gtgBefore: before,
    gtgAfter: cloneNFA(after),
  };

  return { gtg: after, step };
}

/**
 * Compute the PathUpdates that result from eliminating a state.
 * For each (predecessor, successor) pair routed through the state:
 *   R1 = transition from predecessor → state
 *   R2 = self-loop on state (∅ if none, union if multiple)
 *   R3 = transition from state → successor
 *   R4 = existing direct transition predecessor → successor (∅ if none)
 *   expectedResult = eliminationFormula(R1, R2, R3, R4)
 */
export function computePathUpdates(gtg: GTG, stateId: StateId): PathUpdate[] {
  // filter out self-loops and direct transitions to be updated separately
  const incoming = getIncomingTransitions(gtg, stateId).filter(
    (t) => t.source !== stateId,
  );
  const outgoing = getOutgoingTransitions(gtg, stateId).filter(
    (t) => t.target !== stateId,
  );
  const selfLoops = getSelfLoops(gtg, stateId);

  // R2: self-loop expression
  const R2 =
    selfLoops.length === 0
      ? EMPTY_SET
      : // : selfLoops.length === 1
        // ? selfLoops[0]?.symbol ?? EMPTY_SET
        selfLoops.map((t) => t.symbol).reduce((a, b) => union(a, b));

  const pathUpdates: PathUpdate[] = [];

  for (const inc of incoming) {
    for (const out of outgoing) {
      const R1 = inc.symbol;
      const R3 = out.symbol;

      // R4: existing direct transition from predecessor to successor
      const directTransition = getTransitionBetween(
        gtg,
        inc.source,
        out.target,
      );
      const R4 = directTransition ? directTransition.symbol : EMPTY_SET;

      const expected = eliminationFormula(R1, R2, R3, R4);

      pathUpdates.push({
        from: inc.source,
        to: out.target,
        R1,
        R2,
        R3,
        R4,
        expectedResult: expected,
      });
    }
  }

  return pathUpdates;
}

/**
 * Apply an elimination step to the GTG:
 * - For each PathUpdate, set/update the direct transition with the expected result
 * - Remove the eliminated state and all its transitions
 */
export function applyElimination(
  gtg: GTG,
  stateId: StateId,
  pathUpdates: PathUpdate[],
): GTG {
  let resultantNFA = cloneNFA(gtg);

  // First, apply all path updates (add/update direct transitions)
  for (const update of pathUpdates) {
    const existingTransition = getTransitionBetween(
      resultantNFA,
      update.from,
      update.to,
    );

    // if a transition already exists, just need to update the symbol
    if (existingTransition) {
      resultantNFA = {
        ...resultantNFA,
        transitions: resultantNFA.transitions.map((t) =>
          t.id === existingTransition.id
            ? { ...t, symbol: update.expectedResult }
            : t,
        ),
      };
      // Since no transition exists between the states, we create one with new symbol
    } else {
      resultantNFA = {
        ...resultantNFA,
        transitions: [
          ...resultantNFA.transitions,
          {
            id: generateTransitionId(),
            source: update.from,
            target: update.to,
            symbol: update.expectedResult,
          },
        ],
      };
    }
  }

  // Remove the eliminated state and all its transitions
  resultantNFA = {
    ...resultantNFA,
    states: resultantNFA.states.filter((s) => s.id !== stateId),
    transitions: resultantNFA.transitions.filter(
      (t) => t.source !== stateId && t.target !== stateId,
    ),
  };

  return resultantNFA;
}

/**
 * Extract the final regex from a GTG with only start and final states.
 */
export function extractFinalRegex(gtg: GTG): string {
  const startState = gtg.states.find((s) => s.isStart);
  const finalState = gtg.states.find((s) => s.isFinal);

  if (!startState || !finalState) {
    return EMPTY_SET;
  }

  const transition = getTransitionBetween(gtg, startState.id, finalState.id);
  return transition ? transition.symbol : EMPTY_SET;
}

/**
 * Get the list of states that can be eliminated (all except new start S and new final F).
 */
export function getEliminableStates(gtg: GTG): State[] {
  return gtg.states.filter((s) => !s.isStart && !s.isFinal);
}
