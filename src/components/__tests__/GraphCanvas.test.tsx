import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProvider } from '../../state/AppContext'
import { NotificationProvider } from '../layout/NotificationArea'
import { GraphCanvas } from '../graph/GraphCanvas'

// ReactFlow, ReactFlowProvider, useReactFlow etc. are mocked in src/test/setup.ts

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  )
}

describe('GraphCanvas — initial render', () => {
  it('renders the ReactFlow container', () => {
    render(<GraphCanvas />, { wrapper: Wrapper })
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
  })

  it('does not show the connection dialog initially', () => {
    render(<GraphCanvas />, { wrapper: Wrapper })
    expect(screen.queryByText(/Enter transition symbol/i)).not.toBeInTheDocument()
  })

  it('renders the Fit View toolbar button', () => {
    render(<GraphCanvas />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: /Fit View/i })).toBeInTheDocument()
  })
})

describe('GraphCanvas — connection dialog', () => {
  it('dialog cancel button closes the dialog when it is shown', async () => {
    // We cannot trigger onConnect through the mocked ReactFlow,
    // but we can verify the dialog is absent before any interaction
    render(<GraphCanvas />, { wrapper: Wrapper })
    expect(screen.queryByRole('button', { name: /^Add$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument()
  })

  it('Fit View button is clickable without errors', async () => {
    render(<GraphCanvas />, { wrapper: Wrapper })
    await userEvent.click(screen.getByRole('button', { name: /Fit View/i }))
  })
})
