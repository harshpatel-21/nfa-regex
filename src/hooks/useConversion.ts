import { useCallback, useRef } from 'react';
import { useAppContext } from './useAppContext';
import { preprocessForElimination } from '../core/nfa';
import { stateEliminationGenerator } from '../core/stateElimination';
import type { EliminationStep } from '../core/types';

export function useConversion() {
  const { state, dispatch, setMode } = useAppContext();
  const { conversion, nfa } = state;
  const stepsRef = useRef<EliminationStep[]>([]);

  const startConversion = useCallback(() => {
    const gtg = preprocessForElimination(nfa);
    dispatch.conversion({ type: 'START_CONVERSION', payload: { gtg } });

    // Generate all steps
    const generator = stateEliminationGenerator(gtg);
    const steps: EliminationStep[] = [];
    for (const step of generator) {
      steps.push(step);
    }
    stepsRef.current = steps;
    dispatch.conversion({ type: 'SET_STEPS', payload: { steps } });
    setMode('conversion');
  }, [nfa, dispatch, setMode]);

  const nextStep = useCallback(() => {
    dispatch.conversion({ type: 'NEXT_STEP' });
  }, [dispatch]);

  const prevStep = useCallback(() => {
    dispatch.conversion({ type: 'PREV_STEP' });
  }, [dispatch]);

  const goToStep = useCallback(
    (index: number) => {
      dispatch.conversion({ type: 'GO_TO_STEP', payload: { index } });
    },
    [dispatch]
  );

  const selectState = useCallback(
    (stateId: string) => {
      dispatch.conversion({ type: 'SELECT_STATE', payload: { stateId } });
    },
    [dispatch]
  );

  const updateUserInput = useCallback(
    (pathIndex: number, input: string) => {
      dispatch.conversion({ type: 'UPDATE_USER_INPUT', payload: { pathIndex, input } });
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch.conversion({ type: 'RESET' });
    setMode('input');
  }, [dispatch, setMode]);

  const currentStep = conversion.currentStepIndex >= 0
    ? conversion.steps[conversion.currentStepIndex]
    : null;

  const hasNextStep = conversion.currentStepIndex < conversion.steps.length - 1;
  const hasPrevStep = conversion.currentStepIndex > 0;

  return {
    conversion,
    currentStep,
    hasNextStep,
    hasPrevStep,
    startConversion,
    nextStep,
    prevStep,
    goToStep,
    selectState,
    updateUserInput,
    reset,
  };
}
