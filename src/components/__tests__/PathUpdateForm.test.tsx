import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProvider } from '../../state/AppContext'
import { NotificationProvider } from '../layout/NotificationArea'
import { PathUpdateForm } from '../conversion/PathUpdateForm'
import type { PathUpdate, GTG } from '../../core/types'

// framer-motion is mocked in src/test/setup.ts so feedback divs render immediately.

const gtg: GTG = {
  states: [
    { id: 'q0', label: 'q0', isStart: true, isFinal: false },
    { id: 'q1', label: 'q1', isStart: false, isFinal: false },
    { id: 'q2', label: 'q2', isStart: false, isFinal: true },
  ],
  transitions: [],
  alphabet: ['a', 'b'],
}

const basePathUpdate: PathUpdate = {
  from: 'q0',
  to: 'q2',
  R1: 'a',
  R2: '∅',
  R3: 'b',
  R4: '∅',
  expectedResult: 'ab',
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  )
}

function renderForm(pathUpdate: PathUpdate = basePathUpdate) {
  return render(
    <PathUpdateForm
      pathUpdate={pathUpdate}
      pathIndex={0}
      removedStateLabel="q1"
      gtg={gtg}
    />,
    { wrapper: Wrapper }
  )
}

describe('PathUpdateForm — initial render', () => {
  it('renders the path header with state labels', () => {
    renderForm()
    expect(screen.getByText(/q0/)).toBeInTheDocument()
    expect(screen.getByText(/q2/)).toBeInTheDocument()
  })

  it('has a disabled Check Answer button when input is empty', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /Check Answer/i })).toBeDisabled()
  })

  it('renders the Auto-complete button', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /Auto-complete/i })).toBeInTheDocument()
  })

  it('renders the expression input field', () => {
    renderForm()
    expect(screen.getByPlaceholderText('e.g., a+bc*d')).toBeInTheDocument()
  })

  it('does not show feedback before any submission', () => {
    renderForm()
    expect(screen.queryByText(/Correct!/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Not quite/i)).not.toBeInTheDocument()
  })
})

describe('PathUpdateForm — input interaction', () => {
  it('enables Check Answer once the user types something', async () => {
    renderForm()
    await userEvent.type(screen.getByPlaceholderText('e.g., a+bc*d'), 'ab')
    expect(screen.getByRole('button', { name: /Check Answer/i })).not.toBeDisabled()
  })

  it('clears submitted state when user edits input after submission', async () => {
    const pathUpdate: PathUpdate = { ...basePathUpdate, isCorrect: false }
    renderForm(pathUpdate)
    await userEvent.type(screen.getByPlaceholderText('e.g., a+bc*d'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /Check Answer/i }))
    // Feedback is visible after submission
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument()
    // Editing should clear feedback (hasSubmitted → false)
    await userEvent.type(screen.getByPlaceholderText('e.g., a+bc*d'), 'x')
    expect(screen.queryByText(/Not quite/i)).not.toBeInTheDocument()
  })
})

describe('PathUpdateForm — correct answer feedback', () => {
  it('shows "Correct!" after submitting when isCorrect is true', async () => {
    const pathUpdate: PathUpdate = { ...basePathUpdate, isCorrect: true }
    renderForm(pathUpdate)
    await userEvent.type(screen.getByPlaceholderText('e.g., a+bc*d'), 'ab')
    await userEvent.click(screen.getByRole('button', { name: /Check Answer/i }))
    expect(screen.getByText('Correct!')).toBeInTheDocument()
  })

  it('shows "Next Path →" button after a correct submission', async () => {
    const pathUpdate: PathUpdate = { ...basePathUpdate, isCorrect: true }
    renderForm(pathUpdate)
    await userEvent.type(screen.getByPlaceholderText('e.g., a+bc*d'), 'ab')
    await userEvent.click(screen.getByRole('button', { name: /Check Answer/i }))
    expect(screen.getByRole('button', { name: /Next Path/i })).toBeInTheDocument()
  })

  it('disables Check Answer and Auto-complete after a correct submission', async () => {
    const pathUpdate: PathUpdate = { ...basePathUpdate, isCorrect: true }
    renderForm(pathUpdate)
    await userEvent.type(screen.getByPlaceholderText('e.g., a+bc*d'), 'ab')
    await userEvent.click(screen.getByRole('button', { name: /Check Answer/i }))
    expect(screen.getByRole('button', { name: /Check Answer/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Auto-complete/i })).toBeDisabled()
  })
})

describe('PathUpdateForm — incorrect answer feedback', () => {
  it('shows "Not quite" after submitting when isCorrect is false', async () => {
    const pathUpdate: PathUpdate = { ...basePathUpdate, isCorrect: false }
    renderForm(pathUpdate)
    await userEvent.type(screen.getByPlaceholderText('e.g., a+bc*d'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /Check Answer/i }))
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument()
  })

  it('shows "Show answer" button after an incorrect submission', async () => {
    const pathUpdate: PathUpdate = { ...basePathUpdate, isCorrect: false }
    renderForm(pathUpdate)
    await userEvent.type(screen.getByPlaceholderText('e.g., a+bc*d'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /Check Answer/i }))
    expect(screen.getByText(/Show answer/i)).toBeInTheDocument()
  })

  it('reveals the expected answer when "Show answer" is clicked', async () => {
    const pathUpdate: PathUpdate = { ...basePathUpdate, isCorrect: false }
    renderForm(pathUpdate)
    await userEvent.type(screen.getByPlaceholderText('e.g., a+bc*d'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /Check Answer/i }))
    await userEvent.click(screen.getByText(/Show answer/i))
    expect(screen.getByText('ab')).toBeInTheDocument()
  })

  it('toggles to "Hide answer" after showing the answer', async () => {
    const pathUpdate: PathUpdate = { ...basePathUpdate, isCorrect: false }
    renderForm(pathUpdate)
    await userEvent.type(screen.getByPlaceholderText('e.g., a+bc*d'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /Check Answer/i }))
    await userEvent.click(screen.getByText(/Show answer/i))
    expect(screen.getByText(/Hide answer/i)).toBeInTheDocument()
  })
})

describe('PathUpdateForm — auto-complete', () => {
  it('fills the input with the expected result on Auto-complete', async () => {
    renderForm()
    await userEvent.click(screen.getByRole('button', { name: /Auto-complete/i }))
    expect(screen.getByPlaceholderText('e.g., a+bc*d')).toHaveValue('ab')
  })
})

describe('PathUpdateForm — Enter key submission', () => {
  it('submits on Enter when input is non-empty', async () => {
    const pathUpdate: PathUpdate = { ...basePathUpdate, isCorrect: true }
    renderForm(pathUpdate)
    const input = screen.getByPlaceholderText('e.g., a+bc*d')
    await userEvent.type(input, 'ab{Enter}')
    expect(screen.getByText('Correct!')).toBeInTheDocument()
  })
})
