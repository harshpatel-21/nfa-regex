import { createContext } from 'react';
import type { NFA, AppMode } from '../core/types';
import type { NFAAction } from './nfaReducer';
import type { ConversionState, ConversionAction } from './conversionReducer';

export interface AppState {
  mode: AppMode;
  nfa: NFA;
  conversion: ConversionState;
}

export interface AppContextType {
  state: AppState;
  dispatch: {
    nfa: React.Dispatch<NFAAction>;
    conversion: React.Dispatch<ConversionAction>;
  };
  setMode: (mode: AppMode) => void;
}

export const AppContext = createContext<AppContextType | null>(null);
