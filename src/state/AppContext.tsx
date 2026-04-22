import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
} from "react";
import {
  nfaReducer,
  initialNFAState,
  type NFAState,
  type NFAAction,
} from "./nfaReducer";
import {
  stateEliminationReducer,
  initialStateEliminationState,
  type StateEliminationState,
  type StateEliminationAction,
} from "./stateEliminationReducer";
import {
  thompsonReducer,
  initialThompsonState,
  type ThompsonState,
  type ThompsonAction,
} from "./thompsonReducer";

interface AppContextType {
  nfaState: NFAState;
  nfaDispatch: React.Dispatch<NFAAction>;
  stateEliminationState: StateEliminationState;
  stateEliminationDispatch: React.Dispatch<StateEliminationAction>;
  thompsonState: ThompsonState;
  thompsonDispatch: React.Dispatch<ThompsonAction>;
}

const AppContext = createContext<AppContextType | null>(null);

/**
 * Provide NFA, state elimination, and Thompson state to the component tree.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [nfaState, nfaDispatch] = useReducer(nfaReducer, initialNFAState);
  const [stateEliminationState, stateEliminationDispatch] = useReducer(
    stateEliminationReducer,
    initialStateEliminationState,
  );
  const [thompsonState, thompsonDispatch] = useReducer(
    thompsonReducer,
    initialThompsonState,
  );

  const value = useMemo(
    () => ({
      nfaState,
      nfaDispatch,
      stateEliminationState,
      stateEliminationDispatch,
      thompsonState,
      thompsonDispatch,
    }),
    [nfaState, stateEliminationState, thompsonState],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return ctx;
}
