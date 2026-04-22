import { useCallback } from "react";
import { useAppContext } from "../state/AppContext";
import type { State, Transition, NFA, AppMode } from "../core/types";
import {
  generateStateId,
  generateTransitionId,
  nextStateLabel,
} from "../core/nfa";
import { validateNFA } from "../core/validation";

/**
 * Hook that exposes NFA state and all mutation actions via the AppContext.
 */
export function useNFA() {
  const { nfaState, nfaDispatch } = useAppContext();

  const addState = useCallback(
    (overrides?: Partial<State>) => {
      const id = generateStateId();
      const label = nextStateLabel(nfaState.nfa.states);
      const isFirst = nfaState.nfa.states.length === 0;
      const state: State = {
        id,
        label,
        isStart: isFirst,
        isFinal: false,
        ...overrides,
      };
      nfaDispatch({ type: "ADD_STATE", payload: state });
      return state;
    },
    [nfaState.nfa.states, nfaDispatch],
  );

  const removeState = useCallback(
    (stateId: string) => {
      nfaDispatch({ type: "REMOVE_STATE", payload: stateId });
    },
    [nfaDispatch],
  );

  // Update a state's properties, clearing other start states if isStart is being set.
  const updateState = useCallback(
    (id: string, updates: Partial<State>) => {
      // If setting as start, clear other start states
      if (updates.isStart) {
        for (const s of nfaState.nfa.states) {
          if (s.id !== id && s.isStart) {
            nfaDispatch({
              type: "UPDATE_STATE",
              payload: { id: s.id, updates: { isStart: false } },
            });
          }
        }
      }
      nfaDispatch({ type: "UPDATE_STATE", payload: { id, updates } });
    },
    [nfaState.nfa.states, nfaDispatch],
  );

  const addTransition = useCallback(
    (source: string, target: string, symbol: string) => {
      const id = generateTransitionId();
      const transition: Transition = { id, source, target, symbol };
      nfaDispatch({ type: "ADD_TRANSITION", payload: transition });
      return transition;
    },
    [nfaDispatch],
  );

  const removeTransition = useCallback(
    (transitionId: string) => {
      nfaDispatch({ type: "REMOVE_TRANSITION", payload: transitionId });
    },
    [nfaDispatch],
  );

  const updateTransition = useCallback(
    (id: string, updates: Partial<Transition>) => {
      nfaDispatch({ type: "UPDATE_TRANSITION", payload: { id, updates } });
    },
    [nfaDispatch],
  );

  const addSymbolToAlphabet = useCallback(
    (symbol: string) => {
      if (!nfaState.nfa.alphabet.includes(symbol)) {
        nfaDispatch({
          type: "SET_ALPHABET",
          payload: [...nfaState.nfa.alphabet, symbol],
        });
      }
    },
    [nfaState.nfa.alphabet, nfaDispatch],
  );

  const removeSymbolFromAlphabet = useCallback(
    (symbol: string) => {
      nfaDispatch({
        type: "SET_ALPHABET",
        payload: nfaState.nfa.alphabet.filter((s) => s !== symbol),
      });
    },
    [nfaState.nfa.alphabet, nfaDispatch],
  );

  const loadNFA = useCallback(
    (nfa: NFA) => {
      nfaDispatch({ type: "LOAD_NFA", payload: nfa });
    },
    [nfaDispatch],
  );

  const resetNFA = useCallback(() => {
    nfaDispatch({ type: "RESET_NFA" });
  }, [nfaDispatch]);

  const setAppMode = useCallback(
    (mode: AppMode) => {
      nfaDispatch({ type: "SET_APP_MODE", payload: mode });
    },
    [nfaDispatch],
  );

  const validate = useCallback(() => {
    const errors = validateNFA(nfaState.nfa);
    nfaDispatch({ type: "SET_VALIDATION_ERRORS", payload: errors });
    return errors;
  }, [nfaState.nfa, nfaDispatch]);

  return {
    ...nfaState,
    addState,
    removeState,
    updateState,
    addTransition,
    removeTransition,
    updateTransition,
    addSymbolToAlphabet,
    removeSymbolFromAlphabet,
    loadNFA,
    resetNFA,
    setAppMode,
    validate,
  };
}
