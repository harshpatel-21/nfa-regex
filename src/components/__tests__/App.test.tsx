import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'

// All heavy dependencies (ReactFlow, framer-motion) are mocked in src/test/setup.ts.

describe('App — root render', () => {
  it('renders without crashing', () => {
    render(<App />)
  })

  it('shows the application title', () => {
    render(<App />)
    expect(screen.getByText(/NFA.*Regex Converter/i)).toBeInTheDocument()
  })

  it('renders the ReactFlow graph canvas', () => {
    render(<App />)
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
  })

  it('renders the mode-switch buttons', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /NFA.*Regex/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Regex.*NFA/i })).toBeInTheDocument()
  })
})

describe('App — mode switching', () => {
  it('switches to Regex → NFA mode when the button is clicked', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /Regex.*NFA/i }))
    // Panel heading for Thompson's Construction appears in the sidebar
    expect(screen.getByRole('heading', { name: /Thompson/i })).toBeInTheDocument()
  })

  it('switches back to NFA → Regex mode', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /Regex.*NFA/i }))
    await userEvent.click(screen.getByRole('button', { name: /NFA.*Regex/i }))
    // The NFA input panel heading reappears
    expect(screen.getByRole('heading', { name: /NFA Input/i })).toBeInTheDocument()
  })
})
