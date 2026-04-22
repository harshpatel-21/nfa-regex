import { describe, it, expect } from "vitest";
import { nfaReducer, initialNFAState, type NFAState } from "../nfaReducer";
import type { State, Transition } from "../../core/types";

function makeState(id: string, overrides?: Partial<State>): State {
  return { id, label: id, isStart: false, isFinal: false, ...overrides };
}

function makeTransition(
  id: string,
  source: string,
  target: string,
): Transition {
  return { id, source, target, symbol: "a" };
}

describe("nfaReducer — ADD_STATE", () => {
  it("appends the new state to the states array", () => {
    // Arrange
    const newState = makeState("q0", { isStart: true });

    // Act
    const next = nfaReducer(initialNFAState, {
      type: "ADD_STATE",
      payload: newState,
    });

    // Assert
    expect(next.nfa.states).toHaveLength(1);
    expect(next.nfa.states[0]!.id).toBe("q0");
  });
});

describe("nfaReducer — REMOVE_STATE", () => {
  it("removes the state with the given id", () => {
    // Arrange
    const state: NFAState = {
      ...initialNFAState,
      nfa: {
        ...initialNFAState.nfa,
        states: [makeState("q0"), makeState("q1")],
      },
    };

    // Act
    const next = nfaReducer(state, { type: "REMOVE_STATE", payload: "q1" });

    // Assert
    expect(next.nfa.states).toHaveLength(1);
    expect(next.nfa.states[0]!.id).toBe("q0");
  });

  it("removes transitions whose source or target is the removed state", () => {
    // Arrange
    const t = makeTransition("t0", "q0", "q1");
    const state: NFAState = {
      ...initialNFAState,
      nfa: {
        ...initialNFAState.nfa,
        states: [makeState("q0"), makeState("q1")],
        transitions: [t],
      },
    };

    // Act
    const next = nfaReducer(state, { type: "REMOVE_STATE", payload: "q1" });

    // Assert
    expect(next.nfa.transitions).toHaveLength(0);
  });

  it("clears selectedStateId when the removed state was selected", () => {
    // Arrange
    const state: NFAState = {
      ...initialNFAState,
      nfa: { ...initialNFAState.nfa, states: [makeState("q0")] },
      selectedStateId: "q0",
    };

    // Act
    const next = nfaReducer(state, { type: "REMOVE_STATE", payload: "q0" });

    // Assert
    expect(next.selectedStateId).toBeNull();
  });

  it("preserves selectedStateId when a different state is removed", () => {
    // Arrange
    const state: NFAState = {
      ...initialNFAState,
      nfa: {
        ...initialNFAState.nfa,
        states: [makeState("q0"), makeState("q1")],
      },
      selectedStateId: "q0",
    };

    // Act
    const next = nfaReducer(state, { type: "REMOVE_STATE", payload: "q1" });

    // Assert
    expect(next.selectedStateId).toBe("q0");
  });
});

describe("nfaReducer — UPDATE_STATE", () => {
  it("applies partial updates to the matching state only", () => {
    // Arrange
    const state: NFAState = {
      ...initialNFAState,
      nfa: {
        ...initialNFAState.nfa,
        states: [makeState("q0"), makeState("q1")],
      },
    };

    // Act
    const next = nfaReducer(state, {
      type: "UPDATE_STATE",
      payload: { id: "q0", updates: { isFinal: true } },
    });

    // Assert
    expect(next.nfa.states[0]!.isFinal).toBe(true);
    expect(next.nfa.states[1]!.isFinal).toBe(false);
  });
});

describe("nfaReducer — ADD_TRANSITION", () => {
  it("appends the new transition to the transitions array", () => {
    // Arrange
    const t = makeTransition("t0", "q0", "q1");

    // Act
    const next = nfaReducer(initialNFAState, {
      type: "ADD_TRANSITION",
      payload: t,
    });

    // Assert
    expect(next.nfa.transitions).toHaveLength(1);
    expect(next.nfa.transitions[0]!.id).toBe("t0");
  });
});

describe("nfaReducer — REMOVE_TRANSITION", () => {
  it("removes the transition with the given id", () => {
    // Arrange
    const state: NFAState = {
      ...initialNFAState,
      nfa: {
        ...initialNFAState.nfa,
        transitions: [makeTransition("t0", "q0", "q1")],
      },
    };

    // Act
    const next = nfaReducer(state, {
      type: "REMOVE_TRANSITION",
      payload: "t0",
    });

    // Assert
    expect(next.nfa.transitions).toHaveLength(0);
  });

  it("clears selectedTransitionId when the removed transition was selected", () => {
    // Arrange
    const state: NFAState = {
      ...initialNFAState,
      nfa: {
        ...initialNFAState.nfa,
        transitions: [makeTransition("t0", "q0", "q1")],
      },
      selectedTransitionId: "t0",
    };

    // Act
    const next = nfaReducer(state, {
      type: "REMOVE_TRANSITION",
      payload: "t0",
    });

    // Assert
    expect(next.selectedTransitionId).toBeNull();
  });

  it("preserves selectedTransitionId when a different transition is removed", () => {
    // Arrange
    const state: NFAState = {
      ...initialNFAState,
      nfa: {
        ...initialNFAState.nfa,
        transitions: [
          makeTransition("t0", "q0", "q1"),
          makeTransition("t1", "q1", "q0"),
        ],
      },
      selectedTransitionId: "t0",
    };

    // Act
    const next = nfaReducer(state, {
      type: "REMOVE_TRANSITION",
      payload: "t1",
    });

    // Assert
    expect(next.selectedTransitionId).toBe("t0");
  });
});

describe("nfaReducer — UPDATE_TRANSITION", () => {
  it("applies partial updates to the matching transition only", () => {
    // Arrange
    const t0 = makeTransition("t0", "q0", "q1");
    const t1 = makeTransition("t1", "q1", "q0");
    const state: NFAState = {
      ...initialNFAState,
      nfa: { ...initialNFAState.nfa, transitions: [t0, t1] },
    };

    // Act
    const next = nfaReducer(state, {
      type: "UPDATE_TRANSITION",
      payload: { id: "t0", updates: { symbol: "b" } },
    });

    // Assert
    expect(next.nfa.transitions[0]!.symbol).toBe("b");
    expect(next.nfa.transitions[1]!.symbol).toBe("a");
  });
});

describe("nfaReducer — SET_ALPHABET", () => {
  it("replaces the entire alphabet", () => {
    // Act
    const next = nfaReducer(initialNFAState, {
      type: "SET_ALPHABET",
      payload: ["a", "b"],
    });

    // Assert
    expect(next.nfa.alphabet).toEqual(["a", "b"]);
  });
});

describe("nfaReducer — SET_APP_MODE", () => {
  it('updates appMode, resets nfaToRegexPhase to "input", and clears validation errors', () => {
    // Arrange
    const state: NFAState = {
      ...initialNFAState,
      nfaToRegexPhase: "converting",
      validationErrors: [{ field: "state", message: "err" }],
    };

    // Act
    const next = nfaReducer(state, {
      type: "SET_APP_MODE",
      payload: "regex-to-nfa",
    });

    // Assert
    expect(next.appMode).toBe("regex-to-nfa");
    expect(next.nfaToRegexPhase).toBe("input");
    expect(next.validationErrors).toHaveLength(0);
  });
});

describe("nfaReducer — SET_NFA_TO_REGEX_PHASE", () => {
  it("updates nfaToRegexPhase", () => {
    // Act
    const next = nfaReducer(initialNFAState, {
      type: "SET_NFA_TO_REGEX_PHASE",
      payload: "converting",
    });

    // Assert
    expect(next.nfaToRegexPhase).toBe("converting");
  });
});

describe("nfaReducer — default case", () => {
  it("returns the same state reference for an unknown action type", () => {
    const next = nfaReducer(initialNFAState, {
      type: "UNKNOWN_ACTION",
    } as never);
    expect(next).toBe(initialNFAState);
  });
});

describe("nfaReducer — SELECT_STATE / SELECT_TRANSITION", () => {
  it("sets selectedStateId to the given id", () => {
    // Act
    const next = nfaReducer(initialNFAState, {
      type: "SELECT_STATE",
      payload: "q0",
    });

    // Assert
    expect(next.selectedStateId).toBe("q0");
  });

  it("clears selectedStateId when null is dispatched", () => {
    // Arrange
    const state: NFAState = { ...initialNFAState, selectedStateId: "q0" };

    // Act
    const next = nfaReducer(state, { type: "SELECT_STATE", payload: null });

    // Assert
    expect(next.selectedStateId).toBeNull();
  });

  it("sets selectedTransitionId to the given id", () => {
    // Act
    const next = nfaReducer(initialNFAState, {
      type: "SELECT_TRANSITION",
      payload: "t0",
    });

    // Assert
    expect(next.selectedTransitionId).toBe("t0");
  });
});

describe("nfaReducer — LOAD_NFA", () => {
  it("replaces the nfa and clears validation errors", () => {
    // Arrange
    const state: NFAState = {
      ...initialNFAState,
      validationErrors: [{ field: "state", message: "err" }],
    };
    const incoming = {
      states: [makeState("q0", { isStart: true })],
      transitions: [],
      alphabet: ["a"],
    };

    // Act
    const next = nfaReducer(state, { type: "LOAD_NFA", payload: incoming });

    // Assert
    expect(next.nfa).toEqual(incoming);
    expect(next.validationErrors).toHaveLength(0);
  });
});

describe("nfaReducer — RESET_NFA", () => {
  it("resets states, transitions, and selection fields to initial values", () => {
    // Arrange
    const state: NFAState = {
      ...initialNFAState,
      nfa: {
        states: [makeState("q0", { isStart: true })],
        transitions: [makeTransition("t0", "q0", "q0")],
        alphabet: ["a"],
      },
      selectedStateId: "q0",
      selectedTransitionId: "t0",
    };

    // Act
    const next = nfaReducer(state, { type: "RESET_NFA" });

    // Assert
    expect(next.nfa.states).toHaveLength(0);
    expect(next.nfa.transitions).toHaveLength(0);
    expect(next.selectedStateId).toBeNull();
    expect(next.selectedTransitionId).toBeNull();
  });
});

describe("nfaReducer — SET_VALIDATION_ERRORS", () => {
  it("stores the provided validation errors", () => {
    // Arrange
    const errors = [{ field: "state", message: "No final state" }];

    // Act
    const next = nfaReducer(initialNFAState, {
      type: "SET_VALIDATION_ERRORS",
      payload: errors,
    });

    // Assert
    expect(next.validationErrors).toEqual(errors);
  });
});
