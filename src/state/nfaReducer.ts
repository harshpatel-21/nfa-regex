import type {
  NFA,
  State,
  Transition,
  AppMode,
  NFAToRegexPhase,
  ValidationError,
} from "../core/types";
import { createEmptyNFA } from "../core/nfa";

export interface NFAState {
  nfa: NFA;
  appMode: AppMode;
  nfaToRegexPhase: NFAToRegexPhase;
  selectedStateId: string | null;
  selectedTransitionId: string | null;
  validationErrors: ValidationError[];
}

export type NFAAction =
  | { type: "ADD_STATE"; payload: State }
  | { type: "REMOVE_STATE"; payload: string }
  | { type: "UPDATE_STATE"; payload: { id: string; updates: Partial<State> } }
  | { type: "ADD_TRANSITION"; payload: Transition }
  | { type: "REMOVE_TRANSITION"; payload: string }
  | {
      type: "UPDATE_TRANSITION";
      payload: { id: string; updates: Partial<Transition> };
    }
  | { type: "SET_ALPHABET"; payload: string[] }
  | { type: "SET_APP_MODE"; payload: AppMode }
  | { type: "SET_NFA_TO_REGEX_PHASE"; payload: NFAToRegexPhase }
  | { type: "SELECT_STATE"; payload: string | null }
  | { type: "SELECT_TRANSITION"; payload: string | null }
  | { type: "LOAD_NFA"; payload: NFA }
  | { type: "RESET_NFA" }
  | { type: "SET_VALIDATION_ERRORS"; payload: ValidationError[] };

export const initialNFAState: NFAState = {
  nfa: createEmptyNFA(),
  appMode: "nfa-to-regex",
  nfaToRegexPhase: "input",
  selectedStateId: null,
  selectedTransitionId: null,
  validationErrors: [],
};

/**
 * Reducer handling all NFA mutations, mode changes, and selection state.
 */
export function nfaReducer(state: NFAState, action: NFAAction): NFAState {
  switch (action.type) {
    case "ADD_STATE":
      return {
        ...state,
        nfa: {
          ...state.nfa,
          states: [...state.nfa.states, action.payload],
        },
      };

    case "REMOVE_STATE":
      return {
        ...state,
        nfa: {
          ...state.nfa,
          states: state.nfa.states.filter((s) => s.id !== action.payload),
          transitions: state.nfa.transitions.filter(
            (t) => t.source !== action.payload && t.target !== action.payload,
          ),
        },
        selectedStateId:
          state.selectedStateId === action.payload
            ? null
            : state.selectedStateId,
      };

    case "UPDATE_STATE":
      return {
        ...state,
        nfa: {
          ...state.nfa,
          states: state.nfa.states.map((s) =>
            s.id === action.payload.id
              ? { ...s, ...action.payload.updates }
              : s,
          ),
        },
      };

    case "ADD_TRANSITION":
      return {
        ...state,
        nfa: {
          ...state.nfa,
          transitions: [...state.nfa.transitions, action.payload],
        },
      };

    case "REMOVE_TRANSITION":
      return {
        ...state,
        nfa: {
          ...state.nfa,
          transitions: state.nfa.transitions.filter(
            (t) => t.id !== action.payload,
          ),
        },
        selectedTransitionId:
          state.selectedTransitionId === action.payload
            ? null
            : state.selectedTransitionId,
      };

    case "UPDATE_TRANSITION":
      return {
        ...state,
        nfa: {
          ...state.nfa,
          transitions: state.nfa.transitions.map((t) =>
            t.id === action.payload.id
              ? { ...t, ...action.payload.updates }
              : t,
          ),
        },
      };

    case "SET_ALPHABET":
      return {
        ...state,
        nfa: { ...state.nfa, alphabet: action.payload },
      };

    case "SET_APP_MODE":
      return {
        ...state,
        appMode: action.payload,
        nfaToRegexPhase: "input",
        validationErrors: [],
      };

    case "SET_NFA_TO_REGEX_PHASE":
      return {
        ...state,
        nfaToRegexPhase: action.payload,
      };

    case "SELECT_STATE":
      return { ...state, selectedStateId: action.payload };

    case "SELECT_TRANSITION":
      return { ...state, selectedTransitionId: action.payload };

    case "LOAD_NFA":
      return {
        ...state,
        nfa: action.payload, // this may need to be changed depending on how we want to handle loading (eg may need to read in from file and validate first)
        validationErrors: [],
      };

    case "RESET_NFA":
      return {
        ...state,
        nfa: createEmptyNFA(),
        selectedStateId: null,
        selectedTransitionId: null,
        validationErrors: [],
      };

    case "SET_VALIDATION_ERRORS":
      return { ...state, validationErrors: action.payload };

    default:
      return state;
  }
}
