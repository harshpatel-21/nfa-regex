import { useCallback } from 'react'
import { useAppContext } from '../state/AppContext'
import type { ThompsonTemplate } from '../core/types'

export function useThompson() {
  const { thompsonState, thompsonDispatch } = useAppContext()

  const setRegex = useCallback(
    (regex: string) => thompsonDispatch({ type: 'SET_REGEX', payload: regex }),
    [thompsonDispatch]
  )

  const startConstruction = useCallback(
    (regex: string) => thompsonDispatch({ type: 'START', payload: regex }),
    [thompsonDispatch]
  )

  const selectTemplate = useCallback(
    (template: ThompsonTemplate) =>
      thompsonDispatch({ type: 'SELECT_TEMPLATE', payload: template }),
    [thompsonDispatch]
  )

  const nextStep = useCallback(
    () => thompsonDispatch({ type: 'NEXT_STEP' }),
    [thompsonDispatch]
  )

  const autoStep = useCallback(
    () => thompsonDispatch({ type: 'AUTO_STEP' }),
    [thompsonDispatch]
  )

  const reset = useCallback(
    () => thompsonDispatch({ type: 'RESET' }),
    [thompsonDispatch]
  )

  const currentStep = thompsonState.steps[thompsonState.currentStepIndex] ?? null

  return {
    ...thompsonState,
    currentStep,
    setRegex,
    startConstruction,
    selectTemplate,
    nextStep,
    autoStep,
    reset,
  }
}
