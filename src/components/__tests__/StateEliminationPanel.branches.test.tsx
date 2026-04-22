import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StateEliminationPanel } from "../conversion/StateEliminationPanel";
import type { GTG, PathUpdate } from "../../core/types";

const mockUseStateElimination = vi.fn();

vi.mock("../../hooks/useStateElimination", () => ({
  useStateElimination: () => mockUseStateElimination(),
}));

vi.mock("../conversion/StateSelector", () => ({
  StateSelector: () => (
    <div data-testid="state-selector-mock">state selector</div>
  ),
}));

vi.mock("../conversion/PathUpdateForm", () => ({
  PathUpdateForm: () => (
    <div data-testid="path-update-form-mock">path form</div>
  ),
}));

const noop = () => undefined;

function buildHookState(overrides: Record<string, unknown> = {}) {
  return {
    phase: "idle",
    finalRegex: null,
    history: [],
    currentStepIndex: -1,
    currentPathUpdates: [] as PathUpdate[],
    currentPathIndex: 0,
    stateToRemove: null,
    gtg: null as GTG | null,
    completeElimination: noop,
    revertElimination: noop,
    backToStateSelection: noop,
    resetConversion: noop,
    ...overrides,
  };
}

describe("StateEliminationPanel branch rendering", () => {
  beforeEach(() => {
    mockUseStateElimination.mockReset();
  });

  it("renders preprocessing phase text", () => {
    mockUseStateElimination.mockReturnValue(
      buildHookState({ phase: "preprocessing" }),
    );

    render(<StateEliminationPanel />);
    expect(screen.getByText(/Preprocessing/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Back to Input/i }),
    ).toBeInTheDocument();
  });

  it("renders selecting-state controls and revert button when elimination exists in history", () => {
    mockUseStateElimination.mockReturnValue(
      buildHookState({
        phase: "selecting-state",
        history: [
          {
            type: "eliminate",
            affectedPaths: [],
            explanation: "eliminate",
            gtgBefore: { states: [], transitions: [], alphabet: [] },
            gtgAfter: { states: [], transitions: [], alphabet: [] },
          },
        ],
      }),
    );

    render(<StateEliminationPanel />);
    expect(screen.getByTestId("state-selector-mock")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Revert Last Elimination/i }),
    ).toBeInTheDocument();
  });

  it("renders updating-paths status variants: completed, current, pending, and fallback labels", () => {
    const gtg: GTG = {
      states: [
        { id: "a", label: "A", isStart: false, isFinal: false },
        { id: "b", label: "B", isStart: false, isFinal: false },
      ],
      transitions: [],
      alphabet: [],
    };
    const updates: PathUpdate[] = [
      {
        from: "a",
        to: "b",
        R1: "x",
        R2: "∅",
        R3: "y",
        R4: "∅",
        expectedResult: "xy",
        isCorrect: true,
        userInput: "xy",
      },
      {
        from: "missing-from",
        to: "missing-to",
        R1: "m",
        R2: "∅",
        R3: "n",
        R4: "∅",
        expectedResult: "mn",
      },
      {
        from: "b",
        to: "a",
        R1: "p",
        R2: "∅",
        R3: "q",
        R4: "∅",
        expectedResult: "pq",
      },
    ];

    mockUseStateElimination.mockReturnValue(
      buildHookState({
        phase: "updating-paths",
        stateToRemove: "does-not-exist",
        gtg,
        currentPathUpdates: updates,
        currentPathIndex: 1,
      }),
    );

    const { container } = render(<StateEliminationPanel />);
    expect(screen.getByText(/Path 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByTestId("path-update-form-mock")).toBeInTheDocument();
    expect(screen.getByText(/A → B/i)).toBeInTheDocument();
    expect(screen.getByText(/missing-from → missing-to/i)).toBeInTheDocument();
    expect(screen.getByText(/B → A/i)).toBeInTheDocument();
    expect(screen.getByText(/= xy/i)).toBeInTheDocument();
    expect(container.querySelector(".line-through")).not.toBeNull();
  });

  it("renders step-complete unreachable-state message when there are zero path updates", () => {
    mockUseStateElimination.mockReturnValue(
      buildHookState({
        phase: "step-complete",
        stateToRemove: "x",
        gtg: {
          states: [{ id: "x", label: "X", isStart: false, isFinal: false }],
          transitions: [],
          alphabet: [],
        },
        currentPathUpdates: [],
      }),
    );

    render(<StateEliminationPanel />);
    expect(screen.getByText(/is unreachable/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Complete Elimination/i }),
    ).toBeInTheDocument();
  });
});
