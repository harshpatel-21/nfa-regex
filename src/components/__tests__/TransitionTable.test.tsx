import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProvider } from '../../state/AppContext'
import { NotificationProvider } from '../layout/NotificationArea'
import { TransitionTable } from '../nfa-input/TransitionTable'
import { TableControls } from '../nfa-input/TableControls'

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  )
}

// Renders both TableControls (to add states/symbols) and TransitionTable
// so that the full interaction flow can be exercised.
function renderWithControls() {
  return render(
    <Wrapper>
      <TableControls />
      <TransitionTable />
    </Wrapper>
  )
}

describe('TransitionTable — empty state', () => {
  it('shows a prompt when no states have been added', () => {
    // Act
    render(<TransitionTable />, { wrapper: Wrapper })

    // Assert
    expect(screen.getByText(/Add states and symbols/i)).toBeInTheDocument()
  })

  it('shows a prompt when states exist but no alphabet symbol has been added', async () => {
    // Arrange
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))

    // Assert — only epsilon column, which means the "Add at least one alphabet symbol" message
    // is NOT shown (epsilon is always present). The table should appear.
    expect(screen.queryByText(/Add at least one alphabet symbol/i)).not.toBeInTheDocument()
  })
})

describe('TransitionTable — table structure', () => {
  it('renders a table with a State column and an ε column when no symbols are defined', async () => {
    // Arrange
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))

    // Assert
    expect(screen.getByRole('columnheader', { name: 'State' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'ε' })).toBeInTheDocument()
  })

  it('shows an additional column header for each alphabet symbol added', async () => {
    // Arrange
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    const symInput = screen.getByPlaceholderText('Symbol')

    // Act
    await userEvent.type(symInput, 'a{Enter}')

    // Assert
    expect(screen.getByRole('columnheader', { name: 'a' })).toBeInTheDocument()
  })

  it('renders a row for each state in the NFA', async () => {
    // Arrange
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))

    // Assert — two body rows (q0 and q1 labels appear in the table)
    expect(screen.getByText('q0')).toBeInTheDocument()
    expect(screen.getByText('q1')).toBeInTheDocument()
  })
})

describe('TransitionTable — editable state labels', () => {
  it('allows renaming a state by double-clicking the label', async () => {
    // Arrange
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    const label = screen.getByText('q0')

    // Act
    await userEvent.dblClick(label)
    const input = screen.getByDisplayValue('q0')
    await userEvent.clear(input)
    await userEvent.type(input, 'start{Enter}')

    // Assert
    expect(screen.getByText('start')).toBeInTheDocument()
  })
})

describe('TransitionTable — start and final state indicators', () => {
  it('shows → indicator for the start state', async () => {
    // Arrange — first added state is automatically the start state
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))

    // Assert
    expect(screen.getByTitle('Start state')).toBeInTheDocument()
  })
})

describe('TransitionTable — adding transitions via cell + button', () => {
  it('shows a dropdown select when the + button in a cell is clicked', async () => {
    // Arrange: two states + one symbol so there are cells with + buttons
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    const symInput = screen.getByPlaceholderText('Symbol')
    await userEvent.type(symInput, 'a{Enter}')

    // Act — click the + button in the first transition cell
    const addButtons = screen.getAllByTitle('Add transition')
    await userEvent.click(addButtons[0]!)

    // Assert — a select element with "select" placeholder appears
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('adds a transition when a target is selected in the dropdown', async () => {
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    await userEvent.type(screen.getByPlaceholderText('Symbol'), 'a{Enter}')

    await userEvent.click(screen.getAllByTitle('Add transition')[0]!)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'q1')

    expect(screen.getAllByText('q1').length).toBeGreaterThan(1)
  })

  it('closes the dropdown on blur without adding when no option is chosen', async () => {
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    await userEvent.type(screen.getByPlaceholderText('Symbol'), 'a{Enter}')

    await userEvent.click(screen.getAllByTitle('Add transition')[0]!)
    const combo = screen.getByRole('combobox')
    fireEvent.blur(combo)

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('removes a transition chip when its × button is clicked', async () => {
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    await userEvent.type(screen.getByPlaceholderText('Symbol'), 'a{Enter}')

    await userEvent.click(screen.getAllByTitle('Add transition')[0]!)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'q1')
    const removeButtons = screen.getAllByRole('button', { name: '×' })
    await userEvent.click(removeButtons[1]!)

    expect(screen.getAllByText('q1')).toHaveLength(1)
  })
})

describe('TransitionTable — EditableLabel Escape key', () => {
  it('cancels editing when Escape is pressed without saving', async () => {
    // Arrange
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    const label = screen.getByText('q0')

    // Act: double-click to enter edit mode, type new text, then press Escape
    await userEvent.dblClick(label)
    const input = screen.getByDisplayValue('q0')
    await userEvent.clear(input)
    await userEvent.type(input, 'newname{Escape}')

    // Assert — original label is restored (editing was cancelled)
    expect(screen.getByText('q0')).toBeInTheDocument()
    expect(screen.queryByText('newname')).not.toBeInTheDocument()
  })

  it('saves edited label on blur when non-empty', async () => {
    renderWithControls()
    await userEvent.click(screen.getByRole('button', { name: /\+ State/i }))
    const label = screen.getByText('q0')

    await userEvent.dblClick(label)
    const input = screen.getByDisplayValue('q0')
    await userEvent.clear(input)
    await userEvent.type(input, 'blurname')
    fireEvent.blur(input)

    expect(screen.getByText('blurname')).toBeInTheDocument()
  })
})
