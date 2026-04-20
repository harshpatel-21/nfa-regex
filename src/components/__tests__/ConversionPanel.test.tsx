import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProvider } from '../../state/AppContext'
import { NotificationProvider } from '../layout/NotificationArea'
import { NfaToRegexPanel } from '../conversion/NfaToRegexPanel'
import { NFAInputPanel } from '../nfa-input/NFAInputPanel'
import { examples } from '../../data/examples'

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  )
}

describe('NfaToRegexPanel — idle phase (initial render)', () => {
  it('renders the "State Elimination" heading', () => {
    render(<NfaToRegexPanel />, { wrapper: Wrapper })
    expect(screen.getByRole('heading', { name: /State Elimination/i })).toBeInTheDocument()
  })

  it('shows "← Back" button when phase is idle', () => {
    render(<NfaToRegexPanel />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument()
  })

  it('does not show the "Complete Elimination" button when idle', () => {
    render(<NfaToRegexPanel />, { wrapper: Wrapper })
    expect(screen.queryByRole('button', { name: /Complete Elimination/i })).not.toBeInTheDocument()
  })

  it('does not show the final regex section when idle', () => {
    render(<NfaToRegexPanel />, { wrapper: Wrapper })
    expect(screen.queryByText(/Final Regular Expression/i)).not.toBeInTheDocument()
  })
})

describe('NfaToRegexPanel — after starting conversion from an example NFA', () => {
  async function startConversionFromExample() {
    render(
      <Wrapper>
        <NFAInputPanel />
        <NfaToRegexPanel />
      </Wrapper>
    )
    // Load a valid example NFA
    await userEvent.click(screen.getByRole('button', { name: /Load Examples/i }))
    const firstExample = examples[0]!
    await userEvent.click(screen.getByText(firstExample.name))
    // Start conversion
    await userEvent.click(screen.getByRole('button', { name: /Convert to Regex/i }))
  }

  it('shows the "← Back to Input" button once conversion is active', async () => {
    await startConversionFromExample()
    expect(screen.getByRole('button', { name: /Back to Input/i })).toBeInTheDocument()
  })

  it('shows the state selector with eliminable states', async () => {
    await startConversionFromExample()
    expect(screen.getByText(/Select a state to eliminate/i)).toBeInTheDocument()
  })

  it('shows the "Auto-pick" button in the selecting-state phase', async () => {
    await startConversionFromExample()
    expect(screen.getByRole('button', { name: /Auto-pick/i })).toBeInTheDocument()
  })
})
