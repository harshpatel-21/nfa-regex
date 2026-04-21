import { useEffect } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProvider, useAppContext } from '../../state/AppContext'
import { NotificationProvider } from '../layout/NotificationArea'
import { StateSelector } from '../conversion/StateSelector'
import type { GTG, EliminationStep } from '../../core/types'

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  )
}

const noOpStep: EliminationStep = {
  type: 'preprocess',
  affectedPaths: [],
  explanation: 'preprocessed',
  gtgBefore: {
    states: [],
    transitions: [],
    alphabet: [],
  },
  gtgAfter: {
    states: [],
    transitions: [],
    alphabet: [],
  },
}

function SeedStateElimination({ gtg }: { gtg: GTG }) {
  const { stateEliminationDispatch } = useAppContext()

  useEffect(() => {
    stateEliminationDispatch({ type: 'START_CONVERSION', payload: gtg })
    stateEliminationDispatch({
      type: 'PREPROCESS_COMPLETE',
      payload: { gtg, step: noOpStep },
    })
  }, [gtg, stateEliminationDispatch])

  return null
}

function StateProbe() {
  const { stateEliminationState } = useAppContext()
  return <p data-testid="state-to-remove">{stateEliminationState.stateToRemove ?? 'none'}</p>
}

function buildGTG(transitions: GTG['transitions']): GTG {
  return {
    states: [
      { id: 's', label: 's', isStart: true, isFinal: false },
      { id: 'a', label: 'a', isStart: false, isFinal: false },
      { id: 'b', label: 'b', isStart: false, isFinal: false },
      { id: 'f', label: 'f', isStart: false, isFinal: true },
    ],
    transitions,
    alphabet: ['x'],
  }
}

describe('StateSelector', () => {
  it('shows a message when there are no eliminable states', () => {
    render(<StateSelector />, { wrapper: Wrapper })
    expect(screen.getByText(/No states left to eliminate/i)).toBeInTheDocument()
  })

  it('selects a state when a state button is clicked', async () => {
    const gtg = buildGTG([
      { id: 't1', source: 's', target: 'a', symbol: 'x' },
      { id: 't2', source: 'a', target: 'f', symbol: 'x' },
      { id: 't3', source: 's', target: 'b', symbol: 'x' },
      { id: 't4', source: 'b', target: 'f', symbol: 'x' },
    ])

    render(
      <Wrapper>
        <SeedStateElimination gtg={gtg} />
        <StateSelector />
        <StateProbe />
      </Wrapper>
    )

    await userEvent.click(screen.getByRole('button', { name: 'a' }))
    expect(screen.getByTestId('state-to-remove')).toHaveTextContent('a')
  })

  it('auto-pick chooses the state with fewer touching transitions', async () => {
    const gtg = buildGTG([
      { id: 't1', source: 's', target: 'a', symbol: 'x' },
      { id: 't2', source: 'a', target: 'f', symbol: 'x' },
      { id: 't3', source: 'a', target: 'a', symbol: 'x' },
      { id: 't4', source: 's', target: 'b', symbol: 'x' },
    ])

    render(
      <Wrapper>
        <SeedStateElimination gtg={gtg} />
        <StateSelector />
        <StateProbe />
      </Wrapper>
    )

    await userEvent.click(screen.getByRole('button', { name: /Auto-pick/i }))
    expect(screen.getByTestId('state-to-remove')).toHaveTextContent('b')
  })

  it('auto-pick keeps the first candidate on a tie', async () => {
    const gtg = buildGTG([
      { id: 't1', source: 's', target: 'a', symbol: 'x' },
      { id: 't2', source: 'a', target: 'f', symbol: 'x' },
      { id: 't3', source: 's', target: 'b', symbol: 'x' },
      { id: 't4', source: 'b', target: 'f', symbol: 'x' },
    ])

    render(
      <Wrapper>
        <SeedStateElimination gtg={gtg} />
        <StateSelector />
        <StateProbe />
      </Wrapper>
    )

    await userEvent.click(screen.getByRole('button', { name: /Auto-pick/i }))
    expect(screen.getByTestId('state-to-remove')).toHaveTextContent('a')
  })
})