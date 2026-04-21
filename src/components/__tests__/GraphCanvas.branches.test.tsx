import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { GraphCanvas } from '../graph/GraphCanvas'

const mockUseNFA = vi.fn()
const mockUseAppContext = vi.fn()
const mockUseGraphLayout = vi.fn()
const fitViewSpy = vi.fn()

vi.mock('../../hooks/useNFA', () => ({
  useNFA: () => mockUseNFA(),
}))

vi.mock('../../state/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}))

vi.mock('../../hooks/useGraphLayout', () => ({
  useGraphLayout: (...args: unknown[]) => mockUseGraphLayout(...args),
}))

vi.mock('@xyflow/react', async () => {
  const react = await vi.importActual<typeof import('@xyflow/react')>('@xyflow/react')
  return {
    ...react,
    ReactFlow: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="react-flow">{children}</div>
    ),
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Background: () => null,
    Controls: () => null,
    MarkerType: { ArrowClosed: 'arrowclosed' },
    applyNodeChanges: (_changes: unknown[], nodes: unknown[]) => nodes,
    useReactFlow: () => ({
      fitView: fitViewSpy,
      getNodes: vi.fn(() => []),
      getEdges: vi.fn(() => []),
      getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    }),
  }
})

beforeEach(() => {
  mockUseNFA.mockReset()
  mockUseAppContext.mockReset()
  mockUseGraphLayout.mockReset()
  fitViewSpy.mockReset()
  mockUseGraphLayout.mockReturnValue({ nodes: [], edges: [] })
})

function setupBase() {
  mockUseNFA.mockReturnValue({
    nfa: { states: [], transitions: [], alphabet: [] },
    nfaToRegexPhase: 'input',
    appMode: 'nfa-to-regex',
  })
  mockUseAppContext.mockReturnValue({
    stateEliminationState: {
      gtg: null,
      currentPathUpdates: [],
      currentPathIndex: 0,
      stateToRemove: null,
      highlightedR: null,
    },
    thompsonState: {
      phase: 'idle',
      steps: [],
      currentStepIndex: 0,
      isTemplateCorrect: null,
    },
  })
}

describe('GraphCanvas branch coverage scenarios', () => {
  it('handles Thompson idle branch and passes null graphData', () => {
    setupBase()
    mockUseNFA.mockReturnValue({
      nfa: { states: [], transitions: [], alphabet: [] },
      nfaToRegexPhase: 'input',
      appMode: 'regex-to-nfa',
    })

    render(<GraphCanvas />)

    expect(mockUseGraphLayout).toHaveBeenCalled()
    const [graphData] = mockUseGraphLayout.mock.calls[0]!
    expect(graphData).toBeNull()
  })

  it('uses final Thompson NFA in complete phase', () => {
    setupBase()
    const finalNFA = {
      states: [{ id: 'q0', label: 'q0', isStart: true, isFinal: true }],
      transitions: [],
      alphabet: [],
    }
    mockUseNFA.mockReturnValue({
      nfa: { states: [], transitions: [], alphabet: [] },
      nfaToRegexPhase: 'input',
      appMode: 'regex-to-nfa',
    })
    mockUseAppContext.mockReturnValue({
      stateEliminationState: {
        gtg: null,
        currentPathUpdates: [],
        currentPathIndex: 0,
        stateToRemove: null,
        highlightedR: null,
      },
      thompsonState: {
        phase: 'complete',
        steps: [{ nfaAfter: finalNFA }],
        currentStepIndex: 0,
        isTemplateCorrect: true,
      },
    })

    render(<GraphCanvas />)
    const [graphData] = mockUseGraphLayout.mock.calls[0]!
    expect(graphData).toEqual(finalNFA)
  })

  it('uses converting GTG and current path highlight in nfa-to-regex converting mode', () => {
    setupBase()
    const gtg = {
      states: [
        { id: 's', label: 's', isStart: true, isFinal: false },
        { id: 'f', label: 'f', isStart: false, isFinal: true },
      ],
      transitions: [{ id: 't1', source: 's', target: 'f', symbol: 'a' }],
      alphabet: ['a'],
    }
    const currentPath = {
      from: 's',
      to: 'f',
      R1: 'a',
      R2: '∅',
      R3: '∅',
      R4: '∅',
      expectedResult: 'a',
    }

    mockUseNFA.mockReturnValue({
      nfa: { states: [], transitions: [], alphabet: [] },
      nfaToRegexPhase: 'converting',
      appMode: 'nfa-to-regex',
    })
    mockUseAppContext.mockReturnValue({
      stateEliminationState: {
        gtg,
        currentPathUpdates: [currentPath],
        currentPathIndex: 0,
        stateToRemove: 'x',
        highlightedR: 'R2',
      },
      thompsonState: {
        phase: 'idle',
        steps: [],
        currentStepIndex: 0,
        isTemplateCorrect: null,
      },
    })

    render(<GraphCanvas />)

    const [graphData, options] = mockUseGraphLayout.mock.calls[0]!
    expect(graphData).toEqual(gtg)
    expect(options).toMatchObject({
      highlight: {
        stateToRemove: 'x',
        currentPath,
        highlightedR: 'R2',
      },
    })
  })

  it('triggers fitView when template correctness transitions to true', () => {
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 1
      })

    mockUseNFA.mockReturnValue({
      nfa: { states: [], transitions: [], alphabet: [] },
      nfaToRegexPhase: 'input',
      appMode: 'regex-to-nfa',
    })

    const state = {
      stateEliminationState: {
        gtg: null,
        currentPathUpdates: [],
        currentPathIndex: 0,
        stateToRemove: null,
        highlightedR: null,
      },
      thompsonState: {
        phase: 'stepping',
        steps: [{ nfaAfter: { states: [], transitions: [], alphabet: [] }, newStateIds: [], newTransitionIds: [] }],
        currentStepIndex: 0,
        isTemplateCorrect: false,
      },
    }

    mockUseAppContext.mockImplementation(() => state)

    const { rerender } = render(<GraphCanvas />)
    state.thompsonState.isTemplateCorrect = true
    rerender(<GraphCanvas />)

    expect(rafSpy).toHaveBeenCalled()
    expect(fitViewSpy).toHaveBeenCalled()
  })
})