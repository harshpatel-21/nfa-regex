import { useReducer, useState, type ReactNode } from 'react';
import type { AppMode } from '../core/types';
import { nfaReducer } from './nfaReducer';
import { conversionReducer, initialConversionState } from './conversionReducer';
import { createEmptyNFA } from '../core/nfa';
import { AppContext } from './appContextDef';

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('input');
  const [nfa, nfaDispatch] = useReducer(nfaReducer, createEmptyNFA());
  const [conversion, conversionDispatch] = useReducer(conversionReducer, initialConversionState);

  const state = { mode, nfa, conversion };
  const dispatch = { nfa: nfaDispatch, conversion: conversionDispatch };

  return (
    <AppContext.Provider value={{ state, dispatch, setMode }}>
      {children}
    </AppContext.Provider>
  );
}
