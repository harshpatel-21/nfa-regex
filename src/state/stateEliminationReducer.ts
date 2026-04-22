import type {
  GTG,
  EliminationStep,
  PathUpdate,
  StateEliminationPhase,
  StateId,
} from "../core/types";
import { validateUserRegex } from "../core/validation";

export interface StateEliminationState {
  phase: StateEliminationPhase;
  gtg: GTG | null;
  history: EliminationStep[];
  currentStepIndex: number;
  stateToRemove: StateId | null;
  currentPathUpdates: PathUpdate[];
  currentPathIndex: number;
  finalRegex: string | null;
  highlightedR: "R1" | "R2" | "R3" | "R4" | null;
}

export type StateEliminationAction =
  | { type: "START_CONVERSION"; payload: GTG }
  | { type: "SET_PHASE"; payload: StateEliminationPhase }
  | {
      type: "PREPROCESS_COMPLETE";
      payload: { gtg: GTG; step: EliminationStep };
    }
  | { type: "SELECT_STATE_TO_REMOVE"; payload: StateId }
  | { type: "SET_PATH_UPDATES"; payload: PathUpdate[] }
  | {
      type: "SUBMIT_PATH_ANSWER";
      payload: { pathIndex: number; userInput: string };
    }
  | { type: "ADVANCE_PATH" }
  | {
      type: "COMPLETE_ELIMINATION";
      payload: { gtg: GTG; step: EliminationStep };
    }
  | {
      type: "EXTRACT_RESULT";
      payload: { regex: string; step: EliminationStep };
    }
  | { type: "AUTO_COMPLETE_PATH"; payload: number }
  | { type: "SET_HIGHLIGHTED_R"; payload: "R1" | "R2" | "R3" | "R4" | null }
  | { type: "BACK_TO_STATE_SELECTION" }
  | { type: "REVERT_LAST_ELIMINATION" }
  | { type: "RESET_CONVERSION" };

export const initialStateEliminationState: StateEliminationState = {
  phase: "idle",
  gtg: null,
  history: [],
  currentStepIndex: -1,
  stateToRemove: null,
  currentPathUpdates: [],
  currentPathIndex: 0,
  finalRegex: null,
  highlightedR: null,
};

/**
 * Reducer managing state elimination phase, GTG, path updates, history, and revert logic.
 */
export function stateEliminationReducer(
  state: StateEliminationState,
  action: StateEliminationAction,
): StateEliminationState {
  switch (action.type) {
    case "START_CONVERSION":
      return {
        ...initialStateEliminationState,
        phase: "preprocessing",
        gtg: action.payload,
      };

    case "SET_PHASE":
      return { ...state, phase: action.payload };

    case "PREPROCESS_COMPLETE":
      return {
        ...state,
        phase: "selecting-state",
        gtg: action.payload.gtg,
        history: [...state.history, action.payload.step],
        currentStepIndex: state.history.length,
      };

    case "SELECT_STATE_TO_REMOVE":
      return {
        ...state,
        stateToRemove: action.payload,
      };

    case "SET_PATH_UPDATES":
      // If there are no path updates (unreachable state), skip directly to step-complete
      if (action.payload.length === 0) {
        return {
          ...state,
          phase: "step-complete",
          currentPathUpdates: [],
          currentPathIndex: 0,
        };
      }
      return {
        ...state,
        phase: "updating-paths",
        currentPathUpdates: action.payload,
        currentPathIndex: 0,
      };

    case "SUBMIT_PATH_ANSWER": {
      const { pathIndex, userInput } = action.payload;
      const updatedPaths = state.currentPathUpdates.map((p, i) => {
        if (i !== pathIndex) return p;
        const isCorrect = validateUserRegex(userInput, p.expectedResult);
        return { ...p, userInput, isCorrect };
      });
      return {
        ...state,
        currentPathUpdates: updatedPaths,
      };
    }

    case "ADVANCE_PATH": {
      const nextIndex = state.currentPathIndex + 1;
      if (nextIndex >= state.currentPathUpdates.length) {
        return { ...state, phase: "step-complete" };
      }
      return { ...state, currentPathIndex: nextIndex };
    }

    case "AUTO_COMPLETE_PATH": {
      const updatedPaths = state.currentPathUpdates.map((p, i) => {
        if (i !== action.payload) return p;
        return { ...p, userInput: p.expectedResult, isCorrect: true };
      });
      return { ...state, currentPathUpdates: updatedPaths };
    }

    case "COMPLETE_ELIMINATION":
      return {
        ...state,
        phase: "selecting-state",
        gtg: action.payload.gtg,
        history: [...state.history, action.payload.step],
        currentStepIndex: state.history.length,
        stateToRemove: null,
        currentPathUpdates: [],
        currentPathIndex: 0,
      };

    case "EXTRACT_RESULT":
      return {
        ...state,
        phase: "finished",
        finalRegex: action.payload.regex,
        history: [...state.history, action.payload.step],
        currentStepIndex: state.history.length,
      };

    case "SET_HIGHLIGHTED_R":
      return { ...state, highlightedR: action.payload };

    case "BACK_TO_STATE_SELECTION":
      return {
        ...state,
        phase: "selecting-state",
        stateToRemove: null,
        currentPathUpdates: [],
        currentPathIndex: 0,
      };

    case "REVERT_LAST_ELIMINATION": {
      const lastEliminateIdx = state.history
        .map((s) => s.type)
        .lastIndexOf("eliminate");
      if (lastEliminateIdx === -1) return state;
      const step = state.history[lastEliminateIdx];
      if (!step) return state;
      const newHistory = state.history.slice(0, lastEliminateIdx);
      const stateLabel = step.stateToRemove
        ? (step.gtgBefore?.states.find((s) => s.id === step.stateToRemove)
            ?.label ?? step.stateToRemove)
        : "unknown";
      newHistory.push({
        type: "revert",
        gtgBefore: step.gtgAfter,
        gtgAfter: step.gtgBefore,
        explanation: `Reverted elimination of state ${stateLabel}.`,
        affectedPaths: step.affectedPaths,
      });
      return {
        ...state,
        phase: "selecting-state",
        gtg: step.gtgBefore,
        history: newHistory,
        currentStepIndex: newHistory.length - 1,
        stateToRemove: null,
        currentPathUpdates: [],
        currentPathIndex: 0,
        finalRegex: null,
      };
    }

    case "RESET_CONVERSION":
      return { ...initialStateEliminationState };

    default:
      return state;
  }
}
