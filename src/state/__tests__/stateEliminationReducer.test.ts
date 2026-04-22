import { describe, it, expect } from "vitest";
import {
  stateEliminationReducer,
  initialStateEliminationState,
  type StateEliminationState,
} from "../stateEliminationReducer";
import type { GTG, EliminationStep, PathUpdate } from "../../core/types";

function makeGTG(stateIds: string[]): GTG {
  return {
    states: stateIds.map((id) => ({
      id,
      label: id,
      isStart: id === "S",
      isFinal: id === "F",
    })),
    transitions: [],
    alphabet: [],
  };
}

function makePathUpdate(
  from: string,
  to: string,
  expectedResult = "ab",
): PathUpdate {
  return { from, to, R1: "a", R2: "∅", R3: "b", R4: "∅", expectedResult };
}

function makeStep(
  type: EliminationStep["type"],
  gtg: GTG,
  stateToRemove?: string,
): EliminationStep {
  return {
    type,
    explanation: `${type} step`,
    gtgBefore: gtg,
    gtgAfter: gtg,
    affectedPaths: [],
    stateToRemove,
  };
}

describe("stateEliminationReducer — START_CONVERSION", () => {
  it("resets to initial values, sets preprocessing phase, and stores the GTG", () => {
    // Arrange: simulate a state mid-conversion
    const midState: StateEliminationState = {
      ...initialStateEliminationState,
      phase: "finished",
      finalRegex: "a*",
    };
    const gtg = makeGTG(["S", "q0", "F"]);

    // Act
    const next = stateEliminationReducer(midState, {
      type: "START_CONVERSION",
      payload: gtg,
    });

    // Assert
    expect(next.phase).toBe("preprocessing");
    expect(next.gtg).toBe(gtg);
    expect(next.finalRegex).toBeNull();
    expect(next.history).toHaveLength(0);
  });
});

describe("stateEliminationReducer — SET_PHASE", () => {
  it("updates the phase field", () => {
    // Act
    const next = stateEliminationReducer(initialStateEliminationState, {
      type: "SET_PHASE",
      payload: "selecting-state",
    });

    // Assert
    expect(next.phase).toBe("selecting-state");
  });
});

describe("stateEliminationReducer — PREPROCESS_COMPLETE", () => {
  it("transitions to selecting-state phase, updates the GTG, and records the step in history", () => {
    // Arrange
    const gtg = makeGTG(["S", "q0", "F"]);
    const step = makeStep("preprocess", gtg);
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      phase: "preprocessing",
      gtg: makeGTG(["q0"]),
    };

    // Act
    const next = stateEliminationReducer(state, {
      type: "PREPROCESS_COMPLETE",
      payload: { gtg, step },
    });

    // Assert
    expect(next.phase).toBe("selecting-state");
    expect(next.gtg).toBe(gtg);
    expect(next.history).toHaveLength(1);
    expect(next.currentStepIndex).toBe(0);
  });
});

describe("stateEliminationReducer — SELECT_STATE_TO_REMOVE", () => {
  it("stores the selected state id", () => {
    // Act
    const next = stateEliminationReducer(initialStateEliminationState, {
      type: "SELECT_STATE_TO_REMOVE",
      payload: "q0",
    });

    // Assert
    expect(next.stateToRemove).toBe("q0");
  });
});

describe("stateEliminationReducer — SET_PATH_UPDATES", () => {
  it("transitions to updating-paths and stores the path updates when list is non-empty", () => {
    // Arrange
    const paths = [makePathUpdate("S", "F")];

    // Act
    const next = stateEliminationReducer(initialStateEliminationState, {
      type: "SET_PATH_UPDATES",
      payload: paths,
    });

    // Assert
    expect(next.phase).toBe("updating-paths");
    expect(next.currentPathUpdates).toEqual(paths);
    expect(next.currentPathIndex).toBe(0);
  });

  it("skips directly to step-complete when the path list is empty (unreachable state)", () => {
    // Act
    const next = stateEliminationReducer(initialStateEliminationState, {
      type: "SET_PATH_UPDATES",
      payload: [],
    });

    // Assert
    expect(next.phase).toBe("step-complete");
    expect(next.currentPathUpdates).toHaveLength(0);
  });
});

describe("stateEliminationReducer — SUBMIT_PATH_ANSWER", () => {
  it("marks the path correct when the user input matches the expected result", () => {
    // Arrange
    const path = makePathUpdate("S", "F", "ab");
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      currentPathUpdates: [path],
    };

    // Act
    const next = stateEliminationReducer(state, {
      type: "SUBMIT_PATH_ANSWER",
      payload: { pathIndex: 0, userInput: "ab" },
    });

    // Assert
    expect(next.currentPathUpdates[0]!.isCorrect).toBe(true);
    expect(next.currentPathUpdates[0]!.userInput).toBe("ab");
  });

  it("marks the path incorrect when the user input does not match", () => {
    // Arrange
    const path = makePathUpdate("S", "F", "ab");
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      currentPathUpdates: [path],
    };

    // Act
    const next = stateEliminationReducer(state, {
      type: "SUBMIT_PATH_ANSWER",
      payload: { pathIndex: 0, userInput: "wrong" },
    });

    // Assert
    expect(next.currentPathUpdates[0]!.isCorrect).toBe(false);
  });
});

describe("stateEliminationReducer — SUBMIT_PATH_ANSWER multi-path", () => {
  it("leaves untargeted paths unchanged when pathIndex targets a specific entry", () => {
    const path0 = makePathUpdate("S", "q0", "ab");
    const path1 = makePathUpdate("q0", "F", "cd");
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      currentPathUpdates: [path0, path1],
    };

    const next = stateEliminationReducer(state, {
      type: "SUBMIT_PATH_ANSWER",
      payload: { pathIndex: 1, userInput: "cd" },
    });

    // path0 (i=0) hits the `i !== pathIndex` branch and is returned unchanged
    expect(next.currentPathUpdates[0]!.isCorrect).toBeUndefined();
    expect(next.currentPathUpdates[1]!.isCorrect).toBe(true);
  });
});

describe("stateEliminationReducer — ADVANCE_PATH", () => {
  it("increments currentPathIndex when more paths remain", () => {
    // Arrange
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      currentPathUpdates: [
        makePathUpdate("S", "q0"),
        makePathUpdate("q0", "F"),
      ],
      currentPathIndex: 0,
    };

    // Act
    const next = stateEliminationReducer(state, { type: "ADVANCE_PATH" });

    // Assert
    expect(next.currentPathIndex).toBe(1);
  });

  it("transitions to step-complete when advancing past the last path", () => {
    // Arrange
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      currentPathUpdates: [makePathUpdate("S", "F")],
      currentPathIndex: 0,
    };

    // Act
    const next = stateEliminationReducer(state, { type: "ADVANCE_PATH" });

    // Assert
    expect(next.phase).toBe("step-complete");
  });
});

describe("stateEliminationReducer — AUTO_COMPLETE_PATH", () => {
  it("fills in the expected result and marks the path correct", () => {
    // Arrange
    const path = makePathUpdate("S", "F", "ab");
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      currentPathUpdates: [path],
    };

    // Act
    const next = stateEliminationReducer(state, {
      type: "AUTO_COMPLETE_PATH",
      payload: 0,
    });

    // Assert
    expect(next.currentPathUpdates[0]!.userInput).toBe("ab");
    expect(next.currentPathUpdates[0]!.isCorrect).toBe(true);
  });
});

describe("stateEliminationReducer — AUTO_COMPLETE_PATH multi-path", () => {
  it("leaves untargeted paths unchanged when targeting a specific index", () => {
    const path0 = makePathUpdate("S", "q0", "ab");
    const path1 = makePathUpdate("q0", "F", "cd");
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      currentPathUpdates: [path0, path1],
    };

    const next = stateEliminationReducer(state, {
      type: "AUTO_COMPLETE_PATH",
      payload: 1,
    });

    // path0 (i=0) hits the `i !== payload` branch and is returned unchanged
    expect(next.currentPathUpdates[0]!.isCorrect).toBeUndefined();
    expect(next.currentPathUpdates[1]!.userInput).toBe("cd");
    expect(next.currentPathUpdates[1]!.isCorrect).toBe(true);
  });
});

describe("stateEliminationReducer — COMPLETE_ELIMINATION", () => {
  it("returns to selecting-state, appends the step, and resets path tracking", () => {
    // Arrange
    const gtg = makeGTG(["S", "F"]);
    const step = makeStep("eliminate", gtg, "q0");
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      phase: "step-complete",
      stateToRemove: "q0",
      currentPathUpdates: [makePathUpdate("S", "F")],
      currentPathIndex: 0,
    };

    // Act
    const next = stateEliminationReducer(state, {
      type: "COMPLETE_ELIMINATION",
      payload: { gtg, step },
    });

    // Assert
    expect(next.phase).toBe("selecting-state");
    expect(next.stateToRemove).toBeNull();
    expect(next.currentPathUpdates).toHaveLength(0);
    expect(next.currentPathIndex).toBe(0);
    expect(next.history).toHaveLength(1);
  });
});

describe("stateEliminationReducer — EXTRACT_RESULT", () => {
  it("transitions to finished, stores the final regex, and records the step", () => {
    // Arrange
    const gtg = makeGTG(["S", "F"]);
    const step = makeStep("extract", gtg);

    // Act
    const next = stateEliminationReducer(initialStateEliminationState, {
      type: "EXTRACT_RESULT",
      payload: { regex: "a*b", step },
    });

    // Assert
    expect(next.phase).toBe("finished");
    expect(next.finalRegex).toBe("a*b");
    expect(next.history).toHaveLength(1);
  });
});

describe("stateEliminationReducer — SET_HIGHLIGHTED_R", () => {
  it("stores the highlighted R value", () => {
    // Act
    const next = stateEliminationReducer(initialStateEliminationState, {
      type: "SET_HIGHLIGHTED_R",
      payload: "R2",
    });

    // Assert
    expect(next.highlightedR).toBe("R2");
  });

  it("clears the highlight when null is dispatched", () => {
    // Arrange
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      highlightedR: "R1",
    };

    // Act
    const next = stateEliminationReducer(state, {
      type: "SET_HIGHLIGHTED_R",
      payload: null,
    });

    // Assert
    expect(next.highlightedR).toBeNull();
  });
});

describe("stateEliminationReducer — BACK_TO_STATE_SELECTION", () => {
  it("returns to selecting-state and resets path tracking", () => {
    // Arrange
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      phase: "updating-paths",
      stateToRemove: "q0",
      currentPathUpdates: [makePathUpdate("S", "F")],
      currentPathIndex: 0,
    };

    // Act
    const next = stateEliminationReducer(state, {
      type: "BACK_TO_STATE_SELECTION",
    });

    // Assert
    expect(next.phase).toBe("selecting-state");
    expect(next.stateToRemove).toBeNull();
    expect(next.currentPathUpdates).toHaveLength(0);
    expect(next.currentPathIndex).toBe(0);
  });
});

describe("stateEliminationReducer — REVERT_LAST_ELIMINATION", () => {
  it("undoes the last eliminate step and restores the prior GTG", () => {
    // Arrange: history has one preprocess + one eliminate step
    const gtgBefore = makeGTG(["S", "q0", "F"]);
    const gtgAfter = makeGTG(["S", "F"]);
    const preprocessStep = makeStep("preprocess", gtgBefore);
    const eliminateStep: EliminationStep = {
      ...makeStep("eliminate", gtgBefore, "q0"),
      gtgAfter,
    };
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      phase: "selecting-state",
      gtg: gtgAfter,
      history: [preprocessStep, eliminateStep],
      currentStepIndex: 1,
    };

    // Act
    const next = stateEliminationReducer(state, {
      type: "REVERT_LAST_ELIMINATION",
    });

    // Assert
    expect(next.phase).toBe("selecting-state");
    expect(next.gtg).toEqual(gtgBefore);
    expect(next.finalRegex).toBeNull();
    // History length: replaced eliminate with revert entry
    expect(next.history[next.history.length - 1]!.type).toBe("revert");
  });

  it('uses "unknown" as the state label when the eliminate step has no stateToRemove', () => {
    const gtgBefore = makeGTG(["S", "q0", "F"]);
    const gtgAfter = makeGTG(["S", "F"]);
    // eliminate step without stateToRemove — covers the `: 'unknown'` branch at line 165
    const eliminateStep: EliminationStep = {
      type: "eliminate",
      affectedPaths: [],
      explanation: "eliminate without stateToRemove",
      gtgBefore,
      gtgAfter,
      // stateToRemove intentionally omitted
    };
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      phase: "selecting-state",
      gtg: gtgAfter,
      history: [eliminateStep],
      currentStepIndex: 0,
    };

    const next = stateEliminationReducer(state, {
      type: "REVERT_LAST_ELIMINATION",
    });
    expect(next.history[next.history.length - 1]!.explanation).toContain(
      "unknown",
    );
  });

  it("returns state unchanged when there is no eliminate step in history", () => {
    // Arrange: only preprocess step, no eliminate
    const gtg = makeGTG(["S", "F"]);
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      history: [makeStep("preprocess", gtg)],
    };

    // Act
    const next = stateEliminationReducer(state, {
      type: "REVERT_LAST_ELIMINATION",
    });

    // Assert
    expect(next).toBe(state);
  });
});

describe("stateEliminationReducer — RESET_CONVERSION", () => {
  it("returns the initial state", () => {
    // Arrange
    const state: StateEliminationState = {
      ...initialStateEliminationState,
      phase: "finished",
      finalRegex: "a*",
    };

    // Act
    const next = stateEliminationReducer(state, { type: "RESET_CONVERSION" });

    // Assert
    expect(next).toEqual(initialStateEliminationState);
  });
});

describe("stateEliminationReducer — default case", () => {
  it("returns the same state reference for an unknown action type", () => {
    const next = stateEliminationReducer(initialStateEliminationState, {
      type: "UNKNOWN_ACTION",
    } as never);
    expect(next).toBe(initialStateEliminationState);
  });
});
