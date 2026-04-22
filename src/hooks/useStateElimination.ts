import { useCallback } from "react";
import { useAppContext } from "../state/AppContext";
import type { StateId } from "../core/types";
import { nfaToGTG, cloneNFA } from "../core/nfa";
import {
  preprocess,
  computePathUpdates,
  applyElimination,
  extractFinalRegex,
  getEliminableStates,
} from "../core/stateElimination";

/**
 * Hook that exposes state elimination state and the step-by-step conversion actions.
 */
export function useStateElimination() {
  const {
    nfaState,
    nfaDispatch,
    stateEliminationState,
    stateEliminationDispatch,
  } = useAppContext();

  // Convert the current NFA to a GTG and automatically run the preprocessing step.
  const startConversion = useCallback(() => {
    const gtg = nfaToGTG(nfaState.nfa);
    stateEliminationDispatch({ type: "START_CONVERSION", payload: gtg });

    // Auto-preprocess
    const { gtg: preprocessed, step } = preprocess(gtg);
    stateEliminationDispatch({
      type: "PREPROCESS_COMPLETE",
      payload: { gtg: preprocessed, step },
    });

    // Switch to converting phase
    nfaDispatch({ type: "SET_NFA_TO_REGEX_PHASE", payload: "converting" });
  }, [nfaState.nfa, stateEliminationDispatch, nfaDispatch]);

  const selectStateToRemove = useCallback(
    (stateId: StateId) => {
      if (!stateEliminationState.gtg) return;
      stateEliminationDispatch({
        type: "SELECT_STATE_TO_REMOVE",
        payload: stateId,
      });
      const pathUpdates = computePathUpdates(
        stateEliminationState.gtg,
        stateId,
      );
      stateEliminationDispatch({
        type: "SET_PATH_UPDATES",
        payload: pathUpdates,
      });
    },
    [stateEliminationState.gtg, stateEliminationDispatch],
  );

  const submitAnswer = useCallback(
    (pathIndex: number, userInput: string) => {
      stateEliminationDispatch({
        type: "SUBMIT_PATH_ANSWER",
        payload: { pathIndex, userInput },
      });
    },
    [stateEliminationDispatch],
  );

  const autoCompletePath = useCallback(
    (pathIndex: number) => {
      stateEliminationDispatch({
        type: "AUTO_COMPLETE_PATH",
        payload: pathIndex,
      });
    },
    [stateEliminationDispatch],
  );

  const advancePath = useCallback(() => {
    stateEliminationDispatch({ type: "ADVANCE_PATH" });
  }, [stateEliminationDispatch]);

  const completeElimination = useCallback(() => {
    if (!stateEliminationState.gtg || !stateEliminationState.stateToRemove)
      return;

    const stateId = stateEliminationState.stateToRemove;
    const before = cloneNFA(stateEliminationState.gtg);
    const newGtg = applyElimination(
      stateEliminationState.gtg,
      stateId,
      stateEliminationState.currentPathUpdates,
    );

    const removedState = stateEliminationState.gtg.states.find(
      (s) => s.id === stateId,
    );

    const pathCount = stateEliminationState.currentPathUpdates.length;
    const explanationText =
      pathCount === 0
        ? `Eliminated unreachable state ${removedState?.label ?? stateId}. No path updates needed.`
        : `Eliminated state ${removedState?.label ?? stateId}. Updated ${pathCount} path(s).`;

    const step = {
      type: "eliminate" as const,
      stateToRemove: stateId,
      affectedPaths: stateEliminationState.currentPathUpdates,
      explanation: explanationText,
      gtgBefore: before,
      gtgAfter: cloneNFA(newGtg),
    };

    // Check if only start and final remain
    const eliminable = getEliminableStates(newGtg);
    if (eliminable.length === 0) {
      stateEliminationDispatch({
        type: "COMPLETE_ELIMINATION",
        payload: { gtg: newGtg, step },
      });
      const regex = extractFinalRegex(newGtg);
      const extractStep = {
        type: "extract" as const,
        affectedPaths: [],
        explanation: `Final regex: ${regex}`,
        gtgBefore: cloneNFA(newGtg),
        gtgAfter: cloneNFA(newGtg),
      };
      stateEliminationDispatch({
        type: "EXTRACT_RESULT",
        payload: { regex, step: extractStep },
      });
    } else {
      stateEliminationDispatch({
        type: "COMPLETE_ELIMINATION",
        payload: { gtg: newGtg, step },
      });
    }
  }, [stateEliminationState, stateEliminationDispatch]);

  const setHighlightedR = useCallback(
    (r: "R1" | "R2" | "R3" | "R4" | null) => {
      stateEliminationDispatch({ type: "SET_HIGHLIGHTED_R", payload: r });
    },
    [stateEliminationDispatch],
  );

  const revertElimination = useCallback(() => {
    stateEliminationDispatch({ type: "REVERT_LAST_ELIMINATION" });
  }, [stateEliminationDispatch]);

  const backToStateSelection = useCallback(() => {
    stateEliminationDispatch({ type: "BACK_TO_STATE_SELECTION" });
  }, [stateEliminationDispatch]);

  const resetConversion = useCallback(() => {
    stateEliminationDispatch({ type: "RESET_CONVERSION" });
    nfaDispatch({ type: "SET_NFA_TO_REGEX_PHASE", payload: "input" });
  }, [stateEliminationDispatch, nfaDispatch]);

  const eliminableStates = stateEliminationState.gtg
    ? getEliminableStates(stateEliminationState.gtg)
    : [];

  return {
    ...stateEliminationState,
    eliminableStates,
    startConversion,
    selectStateToRemove,
    submitAnswer,
    autoCompletePath,
    advancePath,
    completeElimination,
    setHighlightedR,
    revertElimination,
    backToStateSelection,
    resetConversion,
  };
}
