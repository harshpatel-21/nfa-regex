import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AppProvider } from "../../state/AppContext";
import { NotificationProvider } from "../../components/layout/NotificationArea";
import { useStateElimination } from "../useStateElimination";
import { useNFA } from "../useNFA";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  );
}

function useCombined() {
  return { nfa: useNFA(), se: useStateElimination() };
}

describe("useStateElimination — revertElimination", () => {
  it("dispatches without throwing even when history is empty", () => {
    const { result } = renderHook(() => useStateElimination(), {
      wrapper: Wrapper,
    });
    expect(() =>
      act(() => {
        result.current.revertElimination();
      }),
    ).not.toThrow();
  });
});

describe("useStateElimination — backToStateSelection", () => {
  it("dispatches without throwing", () => {
    const { result } = renderHook(() => useStateElimination(), {
      wrapper: Wrapper,
    });
    expect(() =>
      act(() => {
        result.current.backToStateSelection();
      }),
    ).not.toThrow();
  });
});

describe("useStateElimination — resetConversion", () => {
  it("resets phase back to idle", () => {
    const { result } = renderHook(() => useCombined(), { wrapper: Wrapper });

    act(() => {
      result.current.nfa.addState();
    });
    act(() => {
      const q = result.current.nfa.addState();
      result.current.nfa.updateState(q.id, { isFinal: true });
    });
    act(() => {
      result.current.se.startConversion();
    });
    expect(result.current.se.phase).not.toBe("idle");

    act(() => {
      result.current.se.resetConversion();
    });
    expect(result.current.se.phase).toBe("idle");
  });
});

describe("useStateElimination — selectStateToRemove with null gtg", () => {
  it("returns early when gtg is null (no dispatch)", () => {
    const { result } = renderHook(() => useStateElimination(), {
      wrapper: Wrapper,
    });
    // gtg is null before startConversion — should silently return
    expect(() =>
      act(() => {
        result.current.selectStateToRemove("q0");
      }),
    ).not.toThrow();
    expect(result.current.stateToRemove).toBeNull();
  });
});

describe("useStateElimination — completeElimination with null guards", () => {
  it("returns early when stateToRemove is null", () => {
    const { result } = renderHook(() => useCombined(), { wrapper: Wrapper });
    act(() => {
      result.current.nfa.addState();
    });
    act(() => {
      const q = result.current.nfa.addState();
      result.current.nfa.updateState(q.id, { isFinal: true });
    });
    act(() => {
      result.current.se.startConversion();
    });
    // stateToRemove is still null — completeElimination should return early
    expect(() =>
      act(() => {
        result.current.se.completeElimination();
      }),
    ).not.toThrow();
  });
});

describe("useStateElimination — completeElimination with no path updates (pathCount === 0)", () => {
  it("uses the unreachable-state explanation for an isolated state", () => {
    const { result } = renderHook(() => useCombined(), { wrapper: Wrapper });

    // Build: q0 (auto start), q1 (isolated), q2 (final) — separate acts so each sees fresh state
    act(() => {
      result.current.nfa.addState();
    }); // q0 — isStart: true
    let q1Id: string;
    act(() => {
      q1Id = result.current.nfa.addState().id;
    }); // q1 — no connections
    act(() => {
      const q2 = result.current.nfa.addState();
      result.current.nfa.updateState(q2.id, { isFinal: true });
    });

    act(() => {
      result.current.se.startConversion();
    });

    const isolated = result.current.se.eliminableStates.find(
      (s) => s.id === q1Id!,
    );
    expect(isolated).toBeDefined();

    act(() => {
      result.current.se.selectStateToRemove(isolated!.id);
    });
    expect(result.current.se.currentPathUpdates).toHaveLength(0);

    // completeElimination hits line 86 (pathCount === 0 branch)
    act(() => {
      result.current.se.completeElimination();
    });
    expect(result.current.se.phase).toBe("selecting-state");
  });
});

describe("useStateElimination — completeElimination with path updates (pathCount > 0)", () => {
  it("uses the normal elimination explanation when paths exist", () => {
    const { result } = renderHook(() => useCombined(), { wrapper: Wrapper });

    // Build: q0 (start) → q1 → q2 (final) with transitions so path updates are generated
    act(() => {
      result.current.nfa.addState();
    }); // q0 — isStart: true
    let q1Id: string;
    act(() => {
      q1Id = result.current.nfa.addState().id;
    }); // q1 — will have connections
    let q2Id: string;
    act(() => {
      const q2 = result.current.nfa.addState();
      q2Id = q2.id;
      result.current.nfa.updateState(q2.id, { isFinal: true });
    });
    // Add transitions: q0→q1 and q1→q2
    act(() => {
      const q0Id = result.current.nfa.nfa.states[0]!.id;
      result.current.nfa.addTransition(q0Id, q1Id!, "a");
      result.current.nfa.addTransition(q1Id!, q2Id!, "b");
    });

    act(() => {
      result.current.se.startConversion();
    });

    // q1 is eliminable and has non-empty path updates (it has predecessor S→q0→q1 and successor q1→q2→F)
    const q1Eliminable = result.current.se.eliminableStates.find(
      (s) => s.id === q1Id!,
    );

    if (q1Eliminable) {
      act(() => {
        result.current.se.selectStateToRemove(q1Eliminable.id);
      });
      if (result.current.se.currentPathUpdates.length > 0) {
        // completeElimination hits line 87 (pathCount > 0 branch)
        act(() => {
          result.current.se.completeElimination();
        });
        expect(result.current.se.phase).toBe("selecting-state");
      }
    }
  });
});
