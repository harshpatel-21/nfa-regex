import { describe, it, expect } from "vitest";
import { validateNFA, validateUserRegex } from "../validation";
import type { NFA } from "../types";

function makeValidNFA(): NFA {
  return {
    states: [
      { id: "q0", label: "q0", isStart: true, isFinal: false },
      { id: "q1", label: "q1", isStart: false, isFinal: true },
    ],
    transitions: [{ id: "t0", source: "q0", target: "q1", symbol: "a" }],
    alphabet: ["a"],
  };
}

describe("validateNFA", () => {
  it("returns no errors for a well-formed NFA", () => {
    expect(validateNFA(makeValidNFA())).toHaveLength(0);
  });

  it("errors when there are no states at all", () => {
    const nfa: NFA = { states: [], transitions: [], alphabet: [] };
    const errors = validateNFA(nfa);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field === "states")).toBe(true);
  });

  it("errors when no start state is present", () => {
    const nfa: NFA = {
      states: [{ id: "q0", label: "q0", isStart: false, isFinal: true }],
      transitions: [],
      alphabet: [],
    };
    const errors = validateNFA(nfa);
    expect(errors.some((e) => e.message.includes("start state"))).toBe(true);
  });

  it("errors when more than one start state is present", () => {
    const nfa: NFA = {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: true, isFinal: true },
      ],
      transitions: [],
      alphabet: [],
    };
    const errors = validateNFA(nfa);
    expect(
      errors.some((e) => e.message.includes("exactly one start state")),
    ).toBe(true);
  });

  it("errors when no final state is present", () => {
    const nfa: NFA = {
      states: [{ id: "q0", label: "q0", isStart: true, isFinal: false }],
      transitions: [],
      alphabet: [],
    };
    const errors = validateNFA(nfa);
    expect(errors.some((e) => e.message.toLowerCase().includes("final"))).toBe(
      true,
    );
  });

  it("errors when duplicate state IDs exist", () => {
    const nfa: NFA = {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q0", label: "q0b", isStart: false, isFinal: true },
      ],
      transitions: [],
      alphabet: [],
    };
    const errors = validateNFA(nfa);
    expect(errors.some((e) => e.message.includes("Duplicate"))).toBe(true);
  });

  it("errors when a transition references a non-existent source state", () => {
    const nfa = makeValidNFA();
    nfa.transitions.push({
      id: "t1",
      source: "ghost",
      target: "q1",
      symbol: "b",
    });
    const errors = validateNFA(nfa);
    expect(errors.some((e) => e.field === "transitions")).toBe(true);
  });

  it("errors when a transition references a non-existent target state", () => {
    const nfa = makeValidNFA();
    nfa.transitions.push({
      id: "t1",
      source: "q0",
      target: "ghost",
      symbol: "b",
    });
    const errors = validateNFA(nfa);
    expect(errors.some((e) => e.field === "transitions")).toBe(true);
  });

  it("accepts an NFA with multiple final states", () => {
    const nfa: NFA = {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: true },
        { id: "q2", label: "q2", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "t0", source: "q0", target: "q1", symbol: "a" },
        { id: "t1", source: "q0", target: "q2", symbol: "b" },
      ],
      alphabet: ["a", "b"],
    };
    expect(validateNFA(nfa)).toHaveLength(0);
  });
});

describe("validateUserRegex", () => {
  it("returns true for identical strings", () => {
    expect(validateUserRegex("a+b", "a+b")).toBe(true);
  });

  it("returns true when outer parens differ but structure is equal", () => {
    expect(validateUserRegex("(ab)", "ab")).toBe(true);
  });

  it("returns false for structurally different expressions", () => {
    expect(validateUserRegex("a", "b")).toBe(false);
    expect(validateUserRegex("a*b", "ab*")).toBe(false);
  });

  it("returns false when one has a star and the other does not", () => {
    expect(validateUserRegex("a*", "a")).toBe(false);
  });
});
