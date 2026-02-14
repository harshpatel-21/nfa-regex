import { useCallback } from 'react';
import { useAppContext } from './useAppContext';
import { validateNFA } from '../core/validation';
import type { NFA } from '../core/types';

export function useNFA() {
  const { state, dispatch } = useAppContext();
  const { nfa } = state;

  const addState = useCallback(
    (label: string, isStart = false, isFinal = false) => {
      dispatch.nfa({ type: 'ADD_STATE', payload: { label, isStart, isFinal } });
    },
    [dispatch]
  );

  const removeState = useCallback(
    (stateId: string) => {
      dispatch.nfa({ type: 'REMOVE_STATE', payload: { stateId } });
    },
    [dispatch]
  );

  const updateState = useCallback(
    (stateId: string, updates: { label?: string; isStart?: boolean; isFinal?: boolean }) => {
      dispatch.nfa({ type: 'UPDATE_STATE', payload: { stateId, updates } });
    },
    [dispatch]
  );

  const addTransition = useCallback(
    (source: string, target: string, symbol: string) => {
      dispatch.nfa({ type: 'ADD_TRANSITION', payload: { source, target, symbol } });
    },
    [dispatch]
  );

  const removeTransition = useCallback(
    (transitionId: string) => {
      dispatch.nfa({ type: 'REMOVE_TRANSITION', payload: { transitionId } });
    },
    [dispatch]
  );

  const updateTransition = useCallback(
    (transitionId: string, updates: { source?: string; target?: string; symbol?: string }) => {
      dispatch.nfa({ type: 'UPDATE_TRANSITION', payload: { transitionId, updates } });
    },
    [dispatch]
  );

  const setNFA = useCallback(
    (newNFA: NFA) => {
      dispatch.nfa({ type: 'SET_NFA', payload: newNFA });
    },
    [dispatch]
  );

  const clearNFA = useCallback(() => {
    dispatch.nfa({ type: 'CLEAR' });
  }, [dispatch]);

  const validate = useCallback(() => {
    return validateNFA(nfa);
  }, [nfa]);

  return {
    nfa,
    addState,
    removeState,
    updateState,
    addTransition,
    removeTransition,
    updateTransition,
    setNFA,
    clearNFA,
    validate,
  };
}
