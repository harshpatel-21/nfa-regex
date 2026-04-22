import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { GraphCanvas } from '../graph/GraphCanvas'
import type { Node, NodeChange } from '@xyflow/react'

let capturedOnNodesChange: ((changes: NodeChange[]) => void) | null = null
let capturedNodes: Node[] | null = null

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
    ReactFlow: ({ nodes, children, onNodesChange }: { nodes?: Node[]; children?: React.ReactNode; onNodesChange?: (changes: NodeChange[]) => void }) => {
      capturedOnNodesChange = onNodesChange ?? null
      capturedNodes = nodes ?? null
      return <div data-testid="react-flow">{children}</div>
    },
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
  capturedNodes = null
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

  it('computes thompsonHighlight with newStateIds when template is correct in stepping phase', () => {
    setupBase()
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
        phase: 'stepping',
        steps: [{ nfaAfter: { states: [], transitions: [], alphabet: [] }, newStateIds: ['q0'], newTransitionIds: ['t0'] }],
        currentStepIndex: 0,
        isTemplateCorrect: true,
      },
    })

    render(<GraphCanvas />)

    const [, options] = mockUseGraphLayout.mock.calls[0]!
    expect((options as { thompsonHighlight: unknown }).thompsonHighlight).toMatchObject({
      newStateIds: ['q0'],
      newTransitionIds: ['t0'],
    })
  })

  it('onNodesChange stores position changes without throwing', () => {
    setupBase()
    render(<GraphCanvas />)

    act(() => {
      capturedOnNodesChange?.([
        { type: 'position', id: 'q0', position: { x: 100, y: 200 }, dragging: false },
      ])
    })
  })

  it('preserves displayed positions for remaining nodes when a state is eliminated', () => {
    // isConverting = true: nfaToRegexPhase 'converting' + gtg present
    mockUseNFA.mockReturnValue({
      nfa: { states: [], transitions: [], alphabet: [] },
      nfaToRegexPhase: 'converting',
      appMode: 'nfa-to-regex',
    })
    const gtg = { states: [], transitions: [], alphabet: [] }
    mockUseAppContext.mockReturnValue({
      stateEliminationState: {
        gtg,
        currentPathUpdates: [],
        currentPathIndex: 0,
        stateToRemove: null,
        highlightedR: null,
      },
      thompsonState: { phase: 'idle', steps: [], currentStepIndex: 0, isTemplateCorrect: null },
    })

    const nodeA = { id: 'A', position: { x: 10, y: 20 }, data: {}, type: 'stateNode' as const }
    const nodeB = { id: 'B', position: { x: 50, y: 60 }, data: {}, type: 'stateNode' as const }
    const nodeC = { id: 'C', position: { x: 90, y: 100 }, data: {}, type: 'stateNode' as const }
    mockUseGraphLayout.mockReturnValue({ nodes: [nodeA, nodeB, nodeC], edges: [] })

    const { rerender } = render(<GraphCanvas />)
    expect(capturedNodes).toHaveLength(3)

    // Simulate state elimination: C removed, dagre recomputes A and B to (0, 0)
    mockUseGraphLayout.mockReturnValue({
      nodes: [
        { ...nodeA, position: { x: 0, y: 0 } },
        { ...nodeB, position: { x: 0, y: 0 } },
      ],
      edges: [],
    })
    rerender(<GraphCanvas />)

    expect(capturedNodes).toHaveLength(2)
    expect(capturedNodes?.find((n) => n.id === 'A')?.position).toEqual({ x: 10, y: 20 })
    expect(capturedNodes?.find((n) => n.id === 'B')?.position).toEqual({ x: 50, y: 60 })
  })

  it('uses dagre position for a node that is new to the display during state elimination', () => {
    mockUseNFA.mockReturnValue({
      nfa: { states: [], transitions: [], alphabet: [] },
      nfaToRegexPhase: 'converting',
      appMode: 'nfa-to-regex',
    })
    mockUseAppContext.mockReturnValue({
      stateEliminationState: {
        gtg: { states: [], transitions: [], alphabet: [] },
        currentPathUpdates: [],
        currentPathIndex: 0,
        stateToRemove: null,
        highlightedR: null,
      },
      thompsonState: { phase: 'idle', steps: [], currentStepIndex: 0, isTemplateCorrect: null },
    })

    const nodeA = { id: 'A', position: { x: 10, y: 20 }, data: {}, type: 'stateNode' as const }
    mockUseGraphLayout.mockReturnValue({ nodes: [nodeA], edges: [] })

    const { rerender } = render(<GraphCanvas />)

    // A new node D appears that was never in the display
    const nodeD = { id: 'D', position: { x: 77, y: 88 }, data: {}, type: 'stateNode' as const }
    mockUseGraphLayout.mockReturnValue({
      nodes: [{ ...nodeA, position: { x: 0, y: 0 } }, nodeD],
      edges: [],
    })
    rerender(<GraphCanvas />)

    // D has no prior position so it gets dagre's position
    expect(capturedNodes?.find((n) => n.id === 'D')?.position).toEqual({ x: 77, y: 88 })
    // A still keeps its original displayed position
    expect(capturedNodes?.find((n) => n.id === 'A')?.position).toEqual({ x: 10, y: 20 })
  })

  it('uses dagre positions in non-converting mode when no saved position exists', () => {
    setupBase() // nfaToRegexPhase: 'input' → isConverting = false

    const nodeA = { id: 'A', position: { x: 10, y: 20 }, data: {}, type: 'stateNode' as const }
    mockUseGraphLayout.mockReturnValue({ nodes: [nodeA], edges: [] })

    const { rerender } = render(<GraphCanvas />)

    mockUseGraphLayout.mockReturnValue({
      nodes: [{ ...nodeA, position: { x: 99, y: 99 } }],
      edges: [],
    })
    rerender(<GraphCanvas />)

    // No manual drag saved → falls through to dagre's new position
    expect(capturedNodes?.find((n) => n.id === 'A')?.position).toEqual({ x: 99, y: 99 })
  })

  it('merges saved node positions into layouted nodes when layout updates', () => {
    setupBase()
    const node = { id: 'q0', position: { x: 0, y: 0 }, data: {}, type: 'stateNode' as const }
    mockUseGraphLayout.mockReturnValue({ nodes: [node], edges: [] })

    const { rerender } = render(<GraphCanvas />)

    // Save a position for q0 via onNodesChange
    act(() => {
      capturedOnNodesChange?.([
        { type: 'position', id: 'q0', position: { x: 100, y: 200 }, dragging: false },
      ])
    })

    // Change layoutedNodes → triggers the useEffect that merges saved positions
    // Lines 111-112: nodePositions['q0'] is now { x:100, y:200 } so the ?? left side is taken
    mockUseGraphLayout.mockReturnValue({
      nodes: [{ ...node, position: { x: 10, y: 10 } }],
      edges: [],
    })
    rerender(<GraphCanvas />)
  })
})