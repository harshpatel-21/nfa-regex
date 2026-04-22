import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AppProvider } from "../../state/AppContext";
import { NotificationProvider } from "../../components/layout/NotificationArea";
import { useNFA } from "../useNFA";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  );
}

describe("useNFA — addState", () => {
  it("first state is automatically the start state", () => {
    // Arrange + Act
    const { result } = renderHook(() => useNFA(), { wrapper: Wrapper });
    act(() => {
      result.current.addState();
    });

    // Assert
    expect(result.current.nfa.states[0]!.isStart).toBe(true);
  });

  it("subsequent states are not start states", () => {
    // Arrange
    const { result } = renderHook(() => useNFA(), { wrapper: Wrapper });
    act(() => {
      result.current.addState();
    });

    // Act
    act(() => {
      result.current.addState();
    });

    // Assert
    expect(result.current.nfa.states[1]!.isStart).toBe(false);
  });
});

describe("useNFA — updateState with isStart", () => {
  it("clears the previous start state when a new one is set as start", () => {
    // Arrange: add two states so q0 is start
    const { result } = renderHook(() => useNFA(), { wrapper: Wrapper });
    let q0Id: string;
    let q1Id: string;
    act(() => {
      const q0 = result.current.addState();
      const q1 = result.current.addState();
      q0Id = q0.id;
      q1Id = q1.id;
    });

    // Act: set q1 as start — should clear q0's isStart
    act(() => {
      result.current.updateState(q1Id!, { isStart: true });
    });

    // Assert
    const q0 = result.current.nfa.states.find((s) => s.id === q0Id)!;
    const q1 = result.current.nfa.states.find((s) => s.id === q1Id)!;
    expect(q0.isStart).toBe(false);
    expect(q1.isStart).toBe(true);
  });
});

describe("useNFA — addTransition / removeTransition", () => {
  it("addTransition creates a transition between two states", () => {
    // Arrange
    const { result } = renderHook(() => useNFA(), { wrapper: Wrapper });
    let q0Id: string;
    let q1Id: string;
    act(() => {
      const q0 = result.current.addState();
      const q1 = result.current.addState();
      q0Id = q0.id;
      q1Id = q1.id;
    });

    // Act
    act(() => {
      result.current.addTransition(q0Id!, q1Id!, "a");
    });

    // Assert
    expect(result.current.nfa.transitions).toHaveLength(1);
    expect(result.current.nfa.transitions[0]!.symbol).toBe("a");
  });

  it("removeTransition deletes the transition by id", () => {
    // Arrange
    const { result } = renderHook(() => useNFA(), { wrapper: Wrapper });
    let transitionId: string;
    act(() => {
      const q0 = result.current.addState();
      const q1 = result.current.addState();
      const t = result.current.addTransition(q0.id, q1.id, "a");
      transitionId = t.id;
    });

    // Act
    act(() => {
      result.current.removeTransition(transitionId!);
    });

    // Assert
    expect(result.current.nfa.transitions).toHaveLength(0);
  });
});

describe("useNFA — updateTransition", () => {
  it("updates the symbol of an existing transition", () => {
    // Arrange
    const { result } = renderHook(() => useNFA(), { wrapper: Wrapper });
    let transitionId: string;
    act(() => {
      const q0 = result.current.addState();
      const q1 = result.current.addState();
      const t = result.current.addTransition(q0.id, q1.id, "a");
      transitionId = t.id;
    });

    // Act
    act(() => {
      result.current.updateTransition(transitionId!, { symbol: "b" });
    });

    // Assert
    expect(result.current.nfa.transitions[0]!.symbol).toBe("b");
  });
});

describe("useNFA — resetNFA", () => {
  it("clears all NFA state back to initial", () => {
    const { result } = renderHook(() => useNFA(), { wrapper: Wrapper });
    act(() => {
      result.current.addState();
    });
    expect(result.current.nfa.states).toHaveLength(1);

    act(() => {
      result.current.resetNFA();
    });
    expect(result.current.nfa.states).toHaveLength(0);
  });
});

describe("useNFA — removeSymbolFromAlphabet", () => {
  it("removes the specified symbol from the alphabet", () => {
    // Arrange
    const { result } = renderHook(() => useNFA(), { wrapper: Wrapper });
    act(() => {
      result.current.addSymbolToAlphabet("a");
    });
    act(() => {
      result.current.addSymbolToAlphabet("b");
    });

    // Act
    act(() => {
      result.current.removeSymbolFromAlphabet("a");
    });

    // Assert
    expect(result.current.nfa.alphabet).not.toContain("a");
    expect(result.current.nfa.alphabet).toContain("b");
  });
});
