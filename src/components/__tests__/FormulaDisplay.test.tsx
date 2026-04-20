import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProvider } from '../../state/AppContext'
import { NotificationProvider } from '../layout/NotificationArea'
import { FormulaDisplay } from '../conversion/FormulaDisplay'

// framer-motion (AnimatePresence, motion) is mocked in src/test/setup.ts so
// tooltip content renders immediately without animation.

const defaultProps = {
  R1: 'a',
  R2: '∅',
  R3: 'b',
  R4: 'c',
  predecessorLabel: 'q0',
  successorLabel: 'q2',
  removedStateLabel: 'q1',
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  )
}

describe('FormulaDisplay — R-value boxes', () => {
  it('renders all four R-value labels', () => {
    render(<FormulaDisplay {...defaultProps} />, { wrapper: Wrapper })
    expect(screen.getByText('R₁')).toBeInTheDocument()
    expect(screen.getByText('R₂')).toBeInTheDocument()
    expect(screen.getByText('R₃')).toBeInTheDocument()
    expect(screen.getByText('R₄')).toBeInTheDocument()
  })

  it('displays R1 value inside its box', () => {
    render(<FormulaDisplay {...defaultProps} />, { wrapper: Wrapper })
    expect(screen.getByText('a')).toBeInTheDocument()
  })

  it('displays R4 value inside its box', () => {
    render(<FormulaDisplay {...defaultProps} />, { wrapper: Wrapper })
    expect(screen.getByText('c')).toBeInTheDocument()
  })

  it('renders four info buttons (one per R value)', () => {
    render(<FormulaDisplay {...defaultProps} />, { wrapper: Wrapper })
    const infoBtns = screen.getAllByRole('button', { name: /What is/i })
    expect(infoBtns).toHaveLength(4)
  })
})

describe('FormulaDisplay — formula template', () => {
  it('renders the "Formula:" label', () => {
    render(<FormulaDisplay {...defaultProps} />, { wrapper: Wrapper })
    expect(screen.getByText(/Formula/i)).toBeInTheDocument()
  })
})

describe('FormulaDisplay — info tooltips', () => {
  it('shows the R₁ description when its info button is clicked', async () => {
    render(<FormulaDisplay {...defaultProps} />, { wrapper: Wrapper })
    const [r1InfoBtn] = screen.getAllByRole('button', { name: /What is/i })
    await userEvent.click(r1InfoBtn!)
    expect(screen.getByText(/Transition from q0 to q1/i)).toBeInTheDocument()
  })

  it('hides the R₁ description when its info button is clicked a second time', async () => {
    render(<FormulaDisplay {...defaultProps} />, { wrapper: Wrapper })
    const [r1InfoBtn] = screen.getAllByRole('button', { name: /What is/i })
    await userEvent.click(r1InfoBtn!)
    await userEvent.click(r1InfoBtn!)
    expect(screen.queryByText(/Transition from q0 to q1/i)).not.toBeInTheDocument()
  })

  it('shows the R₂ self-loop description when its info button is clicked', async () => {
    render(<FormulaDisplay {...defaultProps} />, { wrapper: Wrapper })
    const infoBtns = screen.getAllByRole('button', { name: /What is/i })
    await userEvent.click(infoBtns[1]!)
    expect(screen.getByText(/Self-loop on q1/i)).toBeInTheDocument()
  })

  it('shows the R₃ description when its info button is clicked', async () => {
    render(<FormulaDisplay {...defaultProps} />, { wrapper: Wrapper })
    const infoBtns = screen.getAllByRole('button', { name: /What is/i })
    await userEvent.click(infoBtns[2]!)
    expect(screen.getByText(/Transition from q1 to q2/i)).toBeInTheDocument()
  })

  it('shows the R₄ description when its info button is clicked', async () => {
    render(<FormulaDisplay {...defaultProps} />, { wrapper: Wrapper })
    const infoBtns = screen.getAllByRole('button', { name: /What is/i })
    await userEvent.click(infoBtns[3]!)
    expect(screen.getByText(/Existing direct transition from q0 to q2/i)).toBeInTheDocument()
  })

  it('clicking a different info button closes the previously open tooltip', async () => {
    render(<FormulaDisplay {...defaultProps} />, { wrapper: Wrapper })
    const infoBtns = screen.getAllByRole('button', { name: /What is/i })
    await userEvent.click(infoBtns[0]!)
    expect(screen.getByText(/Transition from q0 to q1/i)).toBeInTheDocument()
    await userEvent.click(infoBtns[1]!)
    expect(screen.queryByText(/Transition from q0 to q1/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Self-loop on q1/i)).toBeInTheDocument()
  })
})
