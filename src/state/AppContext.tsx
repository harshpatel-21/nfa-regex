import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
} from 'react'
import {
  nfaReducer,
  initialNFAState,
  type NFAState,
  type NFAAction,
} from './nfaReducer'
import {
  conversionReducer,
  initialConversionState,
  type ConversionState,
  type ConversionAction,
} from './conversionReducer'
import {
  thompsonReducer,
  initialThompsonState,
  type ThompsonState,
  type ThompsonAction,
} from './thompsonReducer'

interface AppContextType {
  nfaState: NFAState
  nfaDispatch: React.Dispatch<NFAAction>
  conversionState: ConversionState
  conversionDispatch: React.Dispatch<ConversionAction>
  thompsonState: ThompsonState
  thompsonDispatch: React.Dispatch<ThompsonAction>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [nfaState, nfaDispatch] = useReducer(nfaReducer, initialNFAState)
  const [conversionState, conversionDispatch] = useReducer(
    conversionReducer,
    initialConversionState
  )
  const [thompsonState, thompsonDispatch] = useReducer(
    thompsonReducer,
    initialThompsonState
  )

  const value = useMemo(
    () => ({ nfaState, nfaDispatch, conversionState, conversionDispatch, thompsonState, thompsonDispatch }),
    [nfaState, conversionState, thompsonState]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return ctx
}
