import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StateNode, type StateNodeData } from '../graph/StateNode'
import type { NodeProps } from '@xyflow/react'

// Minimal NodeProps shim — only the fields StateNode actually reads
function makeProps(data: StateNodeData, selected = false): NodeProps & { data: StateNodeData } {
  return {
    id: 'test-node',
    type: 'stateNode',
    data,
    selected,
    position: { x: 0, y: 0 },
    isConnectable: true,
    dragging: false,
    draggable: false,
    selectable: false,
    deletable: false,
  } as any
}

describe('StateNode — label rendering', () => {
  it('displays the label text', () => {
    render(<StateNode {...makeProps({ label: 'q0', isStart: false, isFinal: false })} />)
    expect(screen.getByText('q0')).toBeInTheDocument()
  })

  it('displays a multi-character label correctly', () => {
    render(<StateNode {...makeProps({ label: 'q10', isStart: false, isFinal: false })} />)
    expect(screen.getByText('q10')).toBeInTheDocument()
  })
})

describe('StateNode — start state', () => {
  it('renders a start arrow (→) when isStart is true', () => {
    render(<StateNode {...makeProps({ label: 'q0', isStart: true, isFinal: false })} />)
    expect(screen.getByText('→')).toBeInTheDocument()
  })

  it('does not render a start arrow when isStart is false', () => {
    render(<StateNode {...makeProps({ label: 'q0', isStart: false, isFinal: false })} />)
    expect(screen.queryByText('→')).not.toBeInTheDocument()
  })
})

describe('StateNode — final state (double circle)', () => {
  it('renders the label inside an inner circle when isFinal is true', () => {
    const { container } = render(
      <StateNode {...makeProps({ label: 'q1', isStart: false, isFinal: true })} />
    )
    // Final state has an extra inner div — two rounded-full divs exist
    const circles = container.querySelectorAll('.rounded-full')
    expect(circles.length).toBeGreaterThanOrEqual(2)
  })

  it('renders a single circle container when isFinal is false', () => {
    const { container } = render(
      <StateNode {...makeProps({ label: 'q1', isStart: false, isFinal: false })} />
    )
    const circles = container.querySelectorAll('.rounded-full')
    expect(circles.length).toBe(1)
  })
})

describe('StateNode — colour states', () => {
  it('applies red border class when isBeingEliminated', () => {
    const { container } = render(
      <StateNode
        {...makeProps({ label: 'q2', isStart: false, isFinal: false, isBeingEliminated: true })}
      />
    )
    expect(container.querySelector('.border-red-500')).not.toBeNull()
  })

  it('applies blue border class when isPredecessor', () => {
    const { container } = render(
      <StateNode
        {...makeProps({ label: 'q2', isStart: false, isFinal: false, isPredecessor: true })}
      />
    )
    expect(container.querySelector('.border-blue-500')).not.toBeNull()
  })

  it('applies green border class when isSuccessor', () => {
    const { container } = render(
      <StateNode
        {...makeProps({ label: 'q2', isStart: false, isFinal: false, isSuccessor: true })}
      />
    )
    expect(container.querySelector('.border-green-500')).not.toBeNull()
  })

  it('applies amber border class when isNewlyAdded', () => {
    const { container } = render(
      <StateNode
        {...makeProps({ label: 'q2', isStart: false, isFinal: false, isNewlyAdded: true })}
      />
    )
    expect(container.querySelector('.border-amber-500')).not.toBeNull()
  })

  it('applies red background when isBeingEliminated', () => {
    const { container } = render(
      <StateNode
        {...makeProps({ label: 'q2', isStart: false, isFinal: false, isBeingEliminated: true })}
      />
    )
    expect(container.querySelector('.bg-red-50')).not.toBeNull()
  })

  it('applies amber background when isNewlyAdded', () => {
    const { container } = render(
      <StateNode
        {...makeProps({ label: 'q2', isStart: false, isFinal: false, isNewlyAdded: true })}
      />
    )
    expect(container.querySelector('.bg-amber-50')).not.toBeNull()
  })
})

describe('StateNode — ReactFlow handles', () => {
  it('renders both target and source handles', () => {
    render(<StateNode {...makeProps({ label: 'q0', isStart: false, isFinal: false })} />)
    expect(screen.getByTestId('handle-target')).toBeInTheDocument()
    expect(screen.getByTestId('handle-source')).toBeInTheDocument()
  })
})
