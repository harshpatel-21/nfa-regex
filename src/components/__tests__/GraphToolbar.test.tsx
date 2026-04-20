import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphToolbar } from '../graph/GraphToolbar'

// useReactFlow is mocked globally in src/test/setup.ts to return { fitView: vi.fn(), ... }

describe('GraphToolbar — rendering', () => {
  it('renders a "Fit View" button', () => {
    render(<GraphToolbar />)
    expect(screen.getByRole('button', { name: /Fit View/i })).toBeInTheDocument()
  })

  it('is positioned absolutely in the top-right corner', () => {
    const { container } = render(<GraphToolbar />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('absolute')
    expect(wrapper.className).toContain('top-3')
    expect(wrapper.className).toContain('right-3')
  })
})

describe('GraphToolbar — interaction', () => {
  it('clicking "Fit View" does not throw', async () => {
    render(<GraphToolbar />)
    await userEvent.click(screen.getByRole('button', { name: /Fit View/i }))
  })
})
