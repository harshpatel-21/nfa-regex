import type { NFA } from "../core/types";

export interface NFAExample {
  name: string;
  description: string;
  nfa: NFA;
}

export const examples: NFAExample[] = [
  {
    name: "Simple Linear",
    description: 'q0 →a→ q1 →b→ q2 (accepts "ab")',
    nfa: {
      states: [
        { id: "ex1_q0", label: "q0", isStart: true, isFinal: false },
        { id: "ex1_q1", label: "q1", isStart: false, isFinal: false },
        { id: "ex1_q2", label: "q2", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "ex1_t0", source: "ex1_q0", target: "ex1_q1", symbol: "a" },
        { id: "ex1_t1", source: "ex1_q1", target: "ex1_q2", symbol: "b" },
      ],
      alphabet: ["a", "b"],
    },
  },
  {
    name: "Self-Loop",
    description: 'q0 →a→ q1 →b→ q1 →c→ q2 (accepts "ab*c")',
    nfa: {
      states: [
        { id: "ex2_q0", label: "q0", isStart: true, isFinal: false },
        { id: "ex2_q1", label: "q1", isStart: false, isFinal: false },
        { id: "ex2_q2", label: "q2", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "ex2_t0", source: "ex2_q0", target: "ex2_q1", symbol: "a" },
        { id: "ex2_t1", source: "ex2_q1", target: "ex2_q1", symbol: "b" },
        { id: "ex2_t2", source: "ex2_q1", target: "ex2_q2", symbol: "c" },
      ],
      alphabet: ["a", "b", "c"],
    },
  },
  {
    name: "Multiple Finals",
    description: "q0 →a→ q1 (final), q0 →b→ q2 (final)",
    nfa: {
      states: [
        { id: "ex3_q0", label: "q0", isStart: true, isFinal: false },
        { id: "ex3_q1", label: "q1", isStart: false, isFinal: true },
        { id: "ex3_q2", label: "q2", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "ex3_t0", source: "ex3_q0", target: "ex3_q1", symbol: "a" },
        { id: "ex3_t1", source: "ex3_q0", target: "ex3_q2", symbol: "b" },
      ],
      alphabet: ["a", "b"],
    },
  },
  {
    name: "Epsilon Transitions",
    description: 'q0 →ε→ q1 →a→ q2 (accepts "a" via epsilon)',
    nfa: {
      states: [
        { id: "ex4_q0", label: "q0", isStart: true, isFinal: false },
        { id: "ex4_q1", label: "q1", isStart: false, isFinal: false },
        { id: "ex4_q2", label: "q2", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "ex4_t0", source: "ex4_q0", target: "ex4_q1", symbol: "ε" },
        { id: "ex4_t1", source: "ex4_q1", target: "ex4_q2", symbol: "a" },
      ],
      alphabet: ["a"],
    },
  },
  {
    name: "Temp Example",
    description: "Complex example with epsilon, self-loops and dead-states",
    nfa: {
      states: [
        { id: "ex5_q0", label: "q0", isStart: true, isFinal: false },
        { id: "ex5_q1", label: "q1", isStart: false, isFinal: true },
        { id: "ex5_q2", label: "q2", isStart: false, isFinal: true },
        { id: "ex5_q3", label: "q3", isStart: false, isFinal: false },
        { id: "ex5_q4", label: "q4", isStart: false, isFinal: false }, // dead state
        { id: "ex5_q5", label: "q5", isStart: false, isFinal: false }, // dead state
      ],
      transitions: [
        { id: "ex5_t0", source: "ex5_q0", target: "ex5_q1", symbol: "a" },
        { id: "ex5_t1", source: "ex5_q0", target: "ex5_q2", symbol: "b" },
        { id: "ex5_t2", source: "ex5_q0", target: "ex5_q3", symbol: "b" },
        { id: "ex5_t3", source: "ex5_q1", target: "ex5_q3", symbol: "ε" },
        { id: "ex5_t4", source: "ex5_q3", target: "ex5_q2", symbol: "a" },
        { id: "ex5_t5", source: "ex5_q3", target: "ex5_q3", symbol: "b" },
      ],
      alphabet: ["a", "b"],
    },
  },
  {
    name: "Messy graph",
    description: "Messy graph",
    nfa: {
      states: [
        { id: "ex5_q0", label: "q0", isStart: true, isFinal: false },
        { id: "ex5_q1", label: "q1", isStart: false, isFinal: true },
        { id: "ex5_q2", label: "q2", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "ex5_t0", source: "ex5_q0", target: "ex5_q0", symbol: "a" },
        { id: "ex5_t1", source: "ex5_q0", target: "ex5_q1", symbol: "a" },
        { id: "ex5_t2", source: "ex5_q0", target: "ex5_q2", symbol: "a" },
        { id: "ex5_t3", source: "ex5_q1", target: "ex5_q0", symbol: "b" },
        { id: "ex5_t4", source: "ex5_q1", target: "ex5_q1", symbol: "c" },
        { id: "ex5_t5", source: "ex5_q1", target: "ex5_q2", symbol: "c" },
        { id: "ex5_t6", source: "ex5_q2", target: "ex5_q2", symbol: "a" },
        { id: "ex5_t7", source: "ex5_q2", target: "ex5_q1", symbol: "b" },
        { id: "ex5_t8", source: "ex5_q2", target: "ex5_q0", symbol: "c" },
      ],
      alphabet: ["a", "b", "c"],
    },
  },
];
