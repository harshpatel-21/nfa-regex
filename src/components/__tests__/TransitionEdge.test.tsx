import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TransitionEdge, type TransitionEdgeData } from '../graph/TransitionEdge'
import { EdgeBendContext } from '../graph/EdgeBendContext'

// getBezierPath, EdgeLabelRenderer, useReactFlow are mocked in src/test/setup.ts.
// EdgeLabelRenderer passes children through as a Fragment so label divs appear in the DOM.

function renderEdge(
  data: TransitionEdgeData = { symbol: 'a' },
  source = 'q0',
  target = 'q1'
) {
  const setEdgeBend = vi.fn()
  const result = render(
    <EdgeBendContext.Provider value={{ bends: {}, setEdgeBend }}>
      <TransitionEdge
        id="edge-1"
        sourceX={0}
        sourceY={0}
        targetX={100}
        targetY={0}
        sourcePosition={'right' as never}
        targetPosition={'left' as never}
        source={source}
        target={target}
        data={data}
        selected={false}
        animated={false}
      />
    </EdgeBendContext.Provider>
  )
  return { ...result, setEdgeBend }
}

describe('TransitionEdge — symbol label', () => {
  it('renders the transition symbol in the edge label', () => {
    renderEdge({ symbol: 'a' })
    expect(screen.getByText('a')).toBeInTheDocument()
  })

  it('renders an epsilon symbol', () => {
    renderEdge({ symbol: 'ε' })
    expect(screen.getByText('ε')).toBeInTheDocument()
  })

  it('renders a multi-character regex symbol', () => {
    renderEdge({ symbol: 'a+b' })
    expect(screen.getByText('a+b')).toBeInTheDocument()
  })
})

describe('TransitionEdge — highlighting', () => {
  it('applies yellow background on the label span when isHighlighted', () => {
    const { container } = renderEdge({ symbol: 'a', isHighlighted: true })
    expect(container.querySelector('.bg-yellow-100')).not.toBeNull()
  })

  it('does not apply yellow background by default', () => {
    const { container } = renderEdge({ symbol: 'a' })
    expect(container.querySelector('.bg-yellow-100')).toBeNull()
  })

  it('applies font-semibold on the label span when isHighlighted', () => {
    const { container } = renderEdge({ symbol: 'a', isHighlighted: true })
    expect(container.querySelector('.font-semibold')).not.toBeNull()
  })
})

describe('TransitionEdge — self-loop', () => {
  it('renders the symbol label for a self-loop (source === target)', () => {
    renderEdge({ symbol: 'b' }, 'q0', 'q0')
    expect(screen.getByText('b')).toBeInTheDocument()
  })

  it('renders highlighted self-loop label', () => {
    const { container } = renderEdge({ symbol: 'b', isHighlighted: true }, 'q0', 'q0')
    expect(container.querySelector('.bg-yellow-100')).not.toBeNull()
  })
})

describe('TransitionEdge — draggable label handle (non-loop)', () => {
  it('renders the label container with grab cursor', () => {
    const { container } = renderEdge({ symbol: 'x' })
    const labelDiv = container.querySelector('[style*="grab"]')
    expect(labelDiv).not.toBeNull()
  })

  it('fires pointer events without throwing', () => {
    const { container } = renderEdge({ symbol: 'x' })
    const labelDiv = container.querySelector('[style*="grab"]') as HTMLElement
    expect(() => {
      fireEvent.pointerDown(labelDiv, { buttons: 1, pointerId: 1 })
      fireEvent.pointerMove(labelDiv, { buttons: 1, movementX: 5, movementY: 5 })
      fireEvent.pointerUp(labelDiv, { pointerId: 1 })
    }).not.toThrow()
  })
})
