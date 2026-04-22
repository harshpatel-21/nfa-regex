import { describe, it, expect, beforeEach } from "vitest";
import {
  resetCounters,
  generateStateId,
  generateTransitionId,
  addState,
  removeState,
  updateState,
  addTransition,
  removeTransition,
  updateTransition,
  getOutgoingTransitions,
  getIncomingTransitions,
  getSelfLoops,
  getTransitionBetween,
  nfaToGTG,
  cloneNFA,
  createEmptyNFA,
  nextStateLabel,
} from "../nfa";
import type { NFA, State, Transition } from "../types";

function makeNFA(): NFA {
  return {
    states: [
      { id: "q0", label: "q0", isStart: true, isFinal: false },
      { id: "q1", label: "q1", isStart: false, isFinal: false },
      { id: "q2", label: "q2", isStart: false, isFinal: true },
    ],
    transitions: [
      { id: "t0", source: "q0", target: "q1", symbol: "a" },
      { id: "t1", source: "q1", target: "q2", symbol: "b" },
      { id: "t2", source: "q1", target: "q1", symbol: "c" },
    ],
    alphabet: ["a", "b", "c"],
  };
}

beforeEach(() => {
  resetCounters();
});

describe("generateStateId / generateTransitionId", () => {
  it("generates sequential IDs starting from 0 after reset", () => {
    expect(generateStateId()).toBe("s_0");
    expect(generateStateId()).toBe("s_1");
    expect(generateTransitionId()).toBe("t_0");
    expect(generateTransitionId()).toBe("t_1");
  });
});

describe("createEmptyNFA", () => {
  it("returns an NFA with no states, transitions, or alphabet", () => {
    const nfa = createEmptyNFA();
    expect(nfa.states).toHaveLength(0);
    expect(nfa.transitions).toHaveLength(0);
    expect(nfa.alphabet).toHaveLength(0);
  });
});

describe("addState / removeState / updateState", () => {
  it("addState appends a new state immutably", () => {
    const nfa = createEmptyNFA();
    const state: State = {
      id: "q0",
      label: "q0",
      isStart: true,
      isFinal: false,
    };
    const result = addState(nfa, state);
    expect(result.states).toHaveLength(1);
    expect(result.states[0]).toEqual(state);
    expect(nfa.states).toHaveLength(0);
  });

  it("removeState removes the state and its connected transitions", () => {
    const nfa = makeNFA();
    const result = removeState(nfa, "q1");
    expect(result.states.map((s) => s.id)).not.toContain("q1");
    expect(
      result.transitions.every((t) => t.source !== "q1" && t.target !== "q1"),
    ).toBe(true);
  });

  it("updateState patches only the specified fields", () => {
    const nfa = makeNFA();
    const result = updateState(nfa, "q0", { label: "start", isFinal: true });
    const q0 = result.states.find((s) => s.id === "q0")!;
    expect(q0.label).toBe("start");
    expect(q0.isFinal).toBe(true);
    expect(q0.isStart).toBe(true);
  });
});

describe("addTransition / removeTransition / updateTransition", () => {
  it("addTransition appends a transition immutably", () => {
    const nfa = makeNFA();
    const t: Transition = {
      id: "t99",
      source: "q0",
      target: "q2",
      symbol: "x",
    };
    const result = addTransition(nfa, t);
    expect(result.transitions).toHaveLength(4);
    expect(result.transitions.at(-1)).toEqual(t);
    expect(nfa.transitions).toHaveLength(3);
  });

  it("removeTransition removes only the matching transition", () => {
    const nfa = makeNFA();
    const result = removeTransition(nfa, "t0");
    expect(result.transitions.map((t) => t.id)).not.toContain("t0");
    expect(result.transitions).toHaveLength(2);
  });

  it("updateTransition patches only the specified fields", () => {
    const nfa = makeNFA();
    const result = updateTransition(nfa, "t0", { symbol: "z" });
    const t = result.transitions.find((t) => t.id === "t0")!;
    expect(t.symbol).toBe("z");
    expect(t.source).toBe("q0");
  });
});

describe("getOutgoingTransitions / getIncomingTransitions / getSelfLoops", () => {
  it("getOutgoingTransitions returns transitions leaving the state", () => {
    const nfa = makeNFA();
    const out = getOutgoingTransitions(nfa, "q1");
    expect(out.map((t) => t.id).sort()).toEqual(["t1", "t2"]);
  });

  it("getIncomingTransitions returns transitions entering the state", () => {
    const nfa = makeNFA();
    const inc = getIncomingTransitions(nfa, "q1");
    expect(inc.map((t) => t.id)).toEqual(["t0", "t2"]);
  });

  it("getSelfLoops returns only self-loop transitions", () => {
    const nfa = makeNFA();
    const loops = getSelfLoops(nfa, "q1");
    expect(loops).toHaveLength(1);
    expect(loops[0]!.id).toBe("t2");
  });

  it("getSelfLoops returns empty array for a state with no self-loop", () => {
    const nfa = makeNFA();
    expect(getSelfLoops(nfa, "q0")).toHaveLength(0);
  });
});

describe("getTransitionBetween", () => {
  it("returns the transition between two states", () => {
    const nfa = makeNFA();
    const t = getTransitionBetween(nfa, "q0", "q1");
    expect(t).toBeDefined();
    expect(t!.symbol).toBe("a");
  });

  it("returns undefined when no transition exists", () => {
    const nfa = makeNFA();
    expect(getTransitionBetween(nfa, "q0", "q2")).toBeUndefined();
  });
});

describe("nfaToGTG", () => {
  it("preserves single transitions as-is", () => {
    const nfa = makeNFA();
    const gtg = nfaToGTG(nfa);
    expect(gtg.transitions).toHaveLength(3);
  });

  it("merges parallel transitions into a union symbol", () => {
    const nfa: NFA = {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "t0", source: "q0", target: "q1", symbol: "a" },
        { id: "t1", source: "q0", target: "q1", symbol: "b" },
      ],
      alphabet: ["a", "b"],
    };
    const gtg = nfaToGTG(nfa);
    expect(gtg.transitions).toHaveLength(1);
    expect(gtg.transitions[0]!.symbol).toBe("a+b");
  });

  it("keeps non-parallel transitions separate", () => {
    const nfa: NFA = {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: false },
        { id: "q2", label: "q2", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "t0", source: "q0", target: "q1", symbol: "a" },
        { id: "t1", source: "q1", target: "q2", symbol: "b" },
      ],
      alphabet: ["a", "b"],
    };
    const gtg = nfaToGTG(nfa);
    expect(gtg.transitions).toHaveLength(2);
  });
});

describe("nfaToGTG — complex merging", () => {
  it("merges three parallel transitions into a 3-way union symbol", () => {
    const nfa: NFA = {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "t0", source: "q0", target: "q1", symbol: "a" },
        { id: "t1", source: "q0", target: "q1", symbol: "b" },
        { id: "t2", source: "q0", target: "q1", symbol: "c" },
      ],
      alphabet: ["a", "b", "c"],
    };
    const gtg = nfaToGTG(nfa);
    expect(gtg.transitions).toHaveLength(1);
    expect(gtg.transitions[0]!.symbol).toBe("a+b+c");
  });

  it("preserves a self-loop as a separate transition while merging parallel non-loop ones", () => {
    const nfa: NFA = {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "t0", source: "q0", target: "q0", symbol: "a" }, // self-loop
        { id: "t1", source: "q0", target: "q1", symbol: "b" },
        { id: "t2", source: "q0", target: "q1", symbol: "c" },
      ],
      alphabet: ["a", "b", "c"],
    };
    const gtg = nfaToGTG(nfa);
    // Self-loop is one transition, parallel b+c is another
    expect(gtg.transitions).toHaveLength(2);
    const selfLoop = gtg.transitions.find(
      (t) => t.source === "q0" && t.target === "q0",
    );
    const toQ1 = gtg.transitions.find(
      (t) => t.source === "q0" && t.target === "q1",
    );
    expect(selfLoop?.symbol).toBe("a");
    expect(toQ1?.symbol).toBe("b+c");
  });
});

describe("cloneNFA", () => {
  it("returns a deep copy — mutations to the clone do not affect the original", () => {
    const nfa = makeNFA();
    const clone = cloneNFA(nfa);
    clone.states[0]!.label = "mutated";
    expect(nfa.states[0]!.label).toBe("q0");
  });
});

describe("nextStateLabel", () => {
  it("returns q0 for an empty list", () => {
    expect(nextStateLabel([])).toBe("q0");
  });

  it("skips existing labels and finds the next free one", () => {
    const states: State[] = [
      { id: "a", label: "q0", isStart: false, isFinal: false },
      { id: "b", label: "q1", isStart: false, isFinal: false },
    ];
    expect(nextStateLabel(states)).toBe("q2");
  });

  it("fills gaps in the sequence", () => {
    const states: State[] = [
      { id: "a", label: "q0", isStart: false, isFinal: false },
      { id: "c", label: "q2", isStart: false, isFinal: false },
    ];
    expect(nextStateLabel(states)).toBe("q1");
  });
});
