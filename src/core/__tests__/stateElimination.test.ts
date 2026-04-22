import { describe, it, expect, beforeEach } from "vitest";
import {
  preprocess,
  computePathUpdates,
  applyElimination,
  extractFinalRegex,
  getEliminableStates,
} from "../stateElimination";
import { resetCounters, nfaToGTG } from "../nfa";
import { buildThompsonSteps } from "../thompson";
import type { GTG } from "../types";
import { EPSILON, EMPTY_SET } from "../types";

beforeEach(() => {
  resetCounters();
});

type Fixture = {
  regex: string;
  gtg: GTG;
  expectedRegex?: string;
};

type HandBuiltFixtureName =
  | "easy"
  | "medium"
  | "hard"
  | "veryHard"
  | "linear"
  | "diamond"
  | "selfLoop";

/**
 * This function
 */
function toEngineRegex(regex: string): string {
  return regex.replace(/∗/g, "*").replace(/ε/g, EPSILON).replace(/\s+/g, "");
}

function gtgFromRegex(regex: string): GTG {
  const engineRegex = toEngineRegex(regex);
  const { steps, error } = buildThompsonSteps(engineRegex);

  if (error) {
    throw new Error(
      `Failed to build fixture GTG for regex "${regex}": ${error}`,
    );
  }

  const finalNFA = steps.at(-1)?.nfaAfter;
  if (!finalNFA) {
    throw new Error(`No Thompson steps generated for regex "${regex}"`);
  }

  return nfaToGTG(finalNFA);
}

// ---- Shared GTG fixtures (replaces makeEasyGTG/makeHardGTG-style builders) ----

const handBuiltFixtures: Record<HandBuiltFixtureName, Fixture> = {
  easy: {
    regex: "a",
    expectedRegex: "a",
    gtg: {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: true },
      ],
      transitions: [{ id: "t0", source: "q0", target: "q1", symbol: "a" }],
      alphabet: ["a"],
    },
  },
  medium: {
    regex: "ab",
    expectedRegex: "ab",
    gtg: {
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
    },
  },
  hard: {
    regex: "a+b",
    expectedRegex: "a+b",
    gtg: {
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
    },
  },
  veryHard: {
    regex: "a*b+",
    expectedRegex: "a*bb*",
    gtg: {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "t0", source: "q0", target: "q0", symbol: "a" },
        { id: "t1", source: "q0", target: "q1", symbol: "b" },
        { id: "t2", source: "q1", target: "q1", symbol: "b" },
      ],
      alphabet: ["a", "b"],
    },
  },
  linear: {
    regex: "abc",
    expectedRegex: "abc",
    gtg: {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: false },
        { id: "q2", label: "q2", isStart: false, isFinal: false },
        { id: "q3", label: "q3", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "t0", source: "q0", target: "q1", symbol: "a" },
        { id: "t1", source: "q1", target: "q2", symbol: "b" },
        { id: "t2", source: "q2", target: "q3", symbol: "c" },
      ],
      alphabet: ["a", "b", "c"],
    },
  },
  diamond: {
    regex: "ac+bd",
    expectedRegex: "ac+bd",
    gtg: {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: false },
        { id: "q2", label: "q2", isStart: false, isFinal: false },
        { id: "q3", label: "q3", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "t0", source: "q0", target: "q1", symbol: "a" },
        { id: "t1", source: "q0", target: "q2", symbol: "b" },
        { id: "t2", source: "q1", target: "q3", symbol: "c" },
        { id: "t3", source: "q2", target: "q3", symbol: "d" },
      ],
      alphabet: ["a", "b", "c", "d"],
    },
  },
  selfLoop: {
    regex: "a(b+c)*d",
    expectedRegex: "a(b+c)*d",
    gtg: {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: false },
        { id: "q2", label: "q2", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "t0", source: "q0", target: "q1", symbol: "a" },
        { id: "t1", source: "q1", target: "q1", symbol: "b" },
        { id: "t2", source: "q1", target: "q1", symbol: "c" },
        { id: "t3", source: "q1", target: "q2", symbol: "d" },
      ],
      alphabet: ["a", "b", "c", "d"],
    },
  },
};

const additionalRegexes = [
  "ab*c",
  "(abc)*+(cba)*",
  "(b+c+ab(b)*)*c",
  "(b+c+ab+ac)*(a+ε)",
  "(a+b+c)*abc(a+b+c)*",
  "(b+c+a(b+c)*a)*",
];

const generatedFixtures: Record<string, Fixture> = {};
for (const [index, regex] of additionalRegexes.entries()) {
  generatedFixtures[`generated_${index + 1}`] = {
    regex,
    gtg: gtgFromRegex(regex),
  };
}

const fixtureCatalog: Record<string, Fixture> = {
  ...handBuiltFixtures,
  ...generatedFixtures,
};

// ---- Helper: run full elimination until only S and F remain ----
function fullyEliminate(gtg: GTG): string {
  let g = preprocess(gtg).gtg;
  let eliminable = getEliminableStates(g);
  while (eliminable.length > 0) {
    const stateToRemove = eliminable[0]!;
    const updates = computePathUpdates(g, stateToRemove.id);
    g = applyElimination(g, stateToRemove.id, updates);
    eliminable = getEliminableStates(g);
  }
  return extractFinalRegex(g);
}

// ---- preprocess ----

describe("preprocess — no original start state (explanation fallback branch)", () => {
  it('explanation falls back to "?" when the original GTG has no start state', () => {
    const noStartGTG: GTG = {
      states: [{ id: "q0", label: "q0", isStart: false, isFinal: true }],
      transitions: [],
      alphabet: [],
    };
    const { step } = preprocess(noStartGTG);
    expect(step.explanation).toContain("?");
  });
});

describe("preprocess", () => {
  it("adds a new start state S and final state F", () => {
    const { gtg } = preprocess(handBuiltFixtures.easy.gtg);
    const start = gtg.states.find((s) => s.isStart);
    const final = gtg.states.find((s) => s.isFinal);
    expect(start?.label).toBe("S");
    expect(final?.label).toBe("F");
  });

  it("original start/final flags are cleared", () => {
    const { gtg } = preprocess(handBuiltFixtures.easy.gtg);
    const q0 = gtg.states.find((s) => s.id === "q0")!;
    const q1 = gtg.states.find((s) => s.id === "q1")!;
    expect(q0.isStart).toBe(false);
    expect(q1.isFinal).toBe(false);
  });

  it("adds ε-transition from S to original start", () => {
    const { gtg } = preprocess(handBuiltFixtures.easy.gtg);
    const S = gtg.states.find((s) => s.isStart)!;
    const sToQ0 = gtg.transitions.find(
      (t) => t.source === S.id && t.target === "q0",
    );
    expect(sToQ0?.symbol).toBe(EPSILON);
  });

  it("adds ε-transition from original final(s) to F", () => {
    const { gtg } = preprocess(handBuiltFixtures.easy.gtg);
    const F = gtg.states.find((s) => s.isFinal)!;
    const q1ToF = gtg.transitions.find(
      (t) => t.source === "q1" && t.target === F.id,
    );
    expect(q1ToF?.symbol).toBe(EPSILON);
  });

  it("adds ε-transitions for all original final states (multi-final NFA)", () => {
    const { gtg } = preprocess(handBuiltFixtures.hard.gtg);
    const F = gtg.states.find((s) => s.isFinal)!;
    const toF = gtg.transitions.filter((t) => t.target === F.id);
    expect(toF).toHaveLength(2);
  });

  it("returns a step record of type preprocess", () => {
    const { step } = preprocess(handBuiltFixtures.easy.gtg);
    expect(step.type).toBe("preprocess");
  });
});

// ---- getEliminableStates ----

describe("getEliminableStates", () => {
  it("returns all non-start, non-final states", () => {
    const { gtg } = preprocess(handBuiltFixtures.easy.gtg);
    const eliminable = getEliminableStates(gtg);
    const labels = eliminable.map((s) => s.label);
    expect(labels).toContain("q0");
    expect(labels).toContain("q1");
    expect(labels).not.toContain("S");
    expect(labels).not.toContain("F");
  });
});

// ---- computePathUpdates ----

describe("computePathUpdates — easy NFA", () => {
  it("returns one path update for the single predecessor/successor pair", () => {
    const { gtg } = preprocess(handBuiltFixtures.easy.gtg);
    const updates = computePathUpdates(gtg, "q0");
    expect(updates).toHaveLength(1);
  });

  it("R1=ε, R2=∅, R3=a, R4=∅ → expectedResult=a", () => {
    const { gtg } = preprocess(handBuiltFixtures.easy.gtg);
    const [update] = computePathUpdates(gtg, "q0")!;
    expect(update!.R1).toBe(EPSILON);
    expect(update!.R2).toBe(EMPTY_SET);
    expect(update!.R3).toBe("a");
    expect(update!.R4).toBe(EMPTY_SET);
    expect(update!.expectedResult).toBe("a");
  });
});

describe("computePathUpdates — very hard NFA (self-loop)", () => {
  it("incorporates self-loop as R2 when eliminating q0", () => {
    const { gtg } = preprocess(handBuiltFixtures.veryHard.gtg);
    const updates = computePathUpdates(gtg, "q0");
    expect(updates).toHaveLength(1);
    const [u] = updates;
    expect(u!.R2).toBe("a");
    expect(u!.expectedResult).toBe("a*b");
  });
});

// ---- applyElimination ----

describe("applyElimination", () => {
  it("removes the eliminated state from the GTG", () => {
    const { gtg } = preprocess(handBuiltFixtures.easy.gtg);
    const updates = computePathUpdates(gtg, "q0");
    const result = applyElimination(gtg, "q0", updates);
    expect(result.states.map((s) => s.id)).not.toContain("q0");
  });

  it("removes all transitions involving the eliminated state", () => {
    const { gtg } = preprocess(handBuiltFixtures.easy.gtg);
    const updates = computePathUpdates(gtg, "q0");
    const result = applyElimination(gtg, "q0", updates);
    expect(
      result.transitions.every((t) => t.source !== "q0" && t.target !== "q0"),
    ).toBe(true);
  });

  it("adds or updates a direct transition for each path update", () => {
    const { gtg } = preprocess(handBuiltFixtures.easy.gtg);
    const S = gtg.states.find((s) => s.isStart)!;
    const updates = computePathUpdates(gtg, "q0");
    const result = applyElimination(gtg, "q0", updates);
    const direct = result.transitions.find(
      (t) => t.source === S.id && t.target === "q1",
    );
    expect(direct?.symbol).toBe("a");
  });
});

// ---- extractFinalRegex ----

describe("extractFinalRegex", () => {
  it("returns ∅ when no S→F transition exists", () => {
    const gtg: GTG = {
      states: [
        { id: "S", label: "S", isStart: true, isFinal: false },
        { id: "F", label: "F", isStart: false, isFinal: true },
      ],
      transitions: [],
      alphabet: [],
    };
    expect(extractFinalRegex(gtg)).toBe(EMPTY_SET);
  });

  it("returns the symbol on the S→F transition", () => {
    const gtg: GTG = {
      states: [
        { id: "S", label: "S", isStart: true, isFinal: false },
        { id: "F", label: "F", isStart: false, isFinal: true },
      ],
      transitions: [{ id: "t", source: "S", target: "F", symbol: "ab*" }],
      alphabet: ["a", "b"],
    };
    expect(extractFinalRegex(gtg)).toBe("ab*");
  });
});

// ---- End-to-end elimination ----

describe("full state elimination pipeline", () => {
  for (const [name, fixture] of Object.entries(fixtureCatalog)) {
    it(`${name} fixture (${fixture.regex}) produces a valid final regex`, () => {
      const result = fullyEliminate(fixture.gtg);

      if (fixture.expectedRegex) {
        expect(result).toBe(fixture.expectedRegex);
      } else {
        expect(result).not.toBe(EMPTY_SET);
        const parsed = buildThompsonSteps(toEngineRegex(result));
        expect(parsed.error).toBeUndefined();
      }
    });
  }
});

// ---- extractFinalRegex edge cases (covers lines 214-215) ----

describe("extractFinalRegex — missing start or final state", () => {
  it("returns ∅ when GTG has no start state at all", () => {
    const gtg: GTG = {
      states: [{ id: "F", label: "F", isStart: false, isFinal: true }],
      transitions: [],
      alphabet: [],
    };
    expect(extractFinalRegex(gtg)).toBe(EMPTY_SET);
  });

  it("returns ∅ when GTG has no final state at all", () => {
    const gtg: GTG = {
      states: [{ id: "S", label: "S", isStart: true, isFinal: false }],
      transitions: [],
      alphabet: [],
    };
    expect(extractFinalRegex(gtg)).toBe(EMPTY_SET);
  });

  it("returns ∅ when GTG is completely empty", () => {
    expect(
      extractFinalRegex({ states: [], transitions: [], alphabet: [] }),
    ).toBe(EMPTY_SET);
  });
});

// ---- computePathUpdates — complex cases ----

describe("computePathUpdates — multiple predecessors/successors", () => {
  it("2 predecessors × 2 successors produces 4 path updates", () => {
    const multiGTG: GTG = {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: false },
        { id: "q2", label: "q2", isStart: false, isFinal: false },
        { id: "q3", label: "q3", isStart: false, isFinal: false },
        { id: "q4", label: "q4", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "t0", source: "q0", target: "q2", symbol: "a" },
        { id: "t1", source: "q1", target: "q2", symbol: "b" },
        { id: "t2", source: "q2", target: "q3", symbol: "c" },
        { id: "t3", source: "q2", target: "q4", symbol: "d" },
      ],
      alphabet: ["a", "b", "c", "d"],
    };
    expect(computePathUpdates(multiGTG, "q2")).toHaveLength(4);
  });

  it("existing direct transition fills R4 and merges with new path via union", () => {
    // q0 -a-> q1, q1 -b-> q2, q0 -z-> q2 (existing direct)
    const r4GTG: GTG = {
      states: [
        { id: "q0", label: "q0", isStart: true, isFinal: false },
        { id: "q1", label: "q1", isStart: false, isFinal: false },
        { id: "q2", label: "q2", isStart: false, isFinal: true },
      ],
      transitions: [
        { id: "t0", source: "q0", target: "q1", symbol: "a" },
        { id: "t1", source: "q1", target: "q2", symbol: "b" },
        { id: "t2", source: "q0", target: "q2", symbol: "z" },
      ],
      alphabet: ["a", "b", "z"],
    };
    const [update] = computePathUpdates(r4GTG, "q1");
    expect(update!.R4).toBe("z");
    expect(update!.expectedResult).toBe("z+ab");
  });
});
