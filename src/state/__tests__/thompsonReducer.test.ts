import { describe, it, expect } from "vitest";
import {
  thompsonReducer,
  initialThompsonState,
  type ThompsonState,
} from "../thompsonReducer";

describe("thompsonReducer — SET_REGEX", () => {
  it("updates the regex field and clears any existing error", () => {
    // Arrange
    const state: ThompsonState = {
      ...initialThompsonState,
      error: "previous error",
    };

    // Act
    const next = thompsonReducer(state, { type: "SET_REGEX", payload: "a+b" });

    // Assert
    expect(next.regex).toBe("a+b");
    expect(next.error).toBeNull();
  });
});

describe("thompsonReducer — START", () => {
  it("transitions to stepping phase and loads steps for a valid regex", () => {
    // Act
    const next = thompsonReducer(initialThompsonState, {
      type: "START",
      payload: "a",
    });

    // Assert
    expect(next.phase).toBe("stepping");
    expect(next.steps.length).toBeGreaterThan(0);
    expect(next.currentStepIndex).toBe(0);
    expect(next.error).toBeNull();
  });

  it("resets template selection when starting a new construction", () => {
    // Arrange: simulate a previous run
    const state: ThompsonState = {
      ...initialThompsonState,
      userTemplate: "union",
      isTemplateCorrect: false,
    };

    // Act
    const next = thompsonReducer(state, { type: "START", payload: "a" });

    // Assert
    expect(next.userTemplate).toBeNull();
    expect(next.isTemplateCorrect).toBeNull();
  });

  it("keeps idle phase and sets error for an invalid regex", () => {
    // Act
    const next = thompsonReducer(initialThompsonState, {
      type: "START",
      payload: "@bad",
    });

    // Assert
    expect(next.phase).toBe("idle");
    expect(next.error).toBeDefined();
    expect(next.error).not.toBeNull();
  });
});

describe("thompsonReducer — SELECT_TEMPLATE", () => {
  it("marks isTemplateCorrect true when the chosen template matches the current step", () => {
    // Arrange: "a" — step 0 expects template "symbol"
    const started = thompsonReducer(initialThompsonState, {
      type: "START",
      payload: "a",
    });

    // Act
    const next = thompsonReducer(started, {
      type: "SELECT_TEMPLATE",
      payload: "symbol",
    });

    // Assert
    expect(next.userTemplate).toBe("symbol");
    expect(next.isTemplateCorrect).toBe(true);
  });

  it("marks isTemplateCorrect false when the chosen template is wrong", () => {
    // Arrange
    const started = thompsonReducer(initialThompsonState, {
      type: "START",
      payload: "a",
    });

    // Act
    const next = thompsonReducer(started, {
      type: "SELECT_TEMPLATE",
      payload: "union",
    });

    // Assert
    expect(next.userTemplate).toBe("union");
    expect(next.isTemplateCorrect).toBe(false);
  });

  it("returns state unchanged when there is no current step (idle phase)", () => {
    // Act — currentStepIndex is 0 but steps array is empty
    const next = thompsonReducer(initialThompsonState, {
      type: "SELECT_TEMPLATE",
      payload: "symbol",
    });

    // Assert
    expect(next).toBe(initialThompsonState);
  });
});

describe("thompsonReducer — NEXT_STEP", () => {
  it("does not advance when the template has not been confirmed correct", () => {
    // Arrange: wrong template selected
    const started = thompsonReducer(initialThompsonState, {
      type: "START",
      payload: "ab",
    });
    const wrong = thompsonReducer(started, {
      type: "SELECT_TEMPLATE",
      payload: "union",
    });

    // Act
    const next = thompsonReducer(wrong, { type: "NEXT_STEP" });

    // Assert — step index unchanged
    expect(next.currentStepIndex).toBe(wrong.currentStepIndex);
  });

  it("advances to the next step and resets template selection when correct", () => {
    // Arrange: "ab" → step 0 is "symbol" for 'a'
    const started = thompsonReducer(initialThompsonState, {
      type: "START",
      payload: "ab",
    });
    const correct = thompsonReducer(started, {
      type: "SELECT_TEMPLATE",
      payload: "symbol",
    });

    // Act
    const next = thompsonReducer(correct, { type: "NEXT_STEP" });

    // Assert
    expect(next.currentStepIndex).toBe(1);
    expect(next.userTemplate).toBeNull();
    expect(next.isTemplateCorrect).toBeNull();
  });

  it('transitions to "complete" phase after confirming the final step', () => {
    // Arrange: "a" has exactly 1 step
    let s = thompsonReducer(initialThompsonState, {
      type: "START",
      payload: "a",
    });
    s = thompsonReducer(s, { type: "SELECT_TEMPLATE", payload: "symbol" });

    // Act
    const next = thompsonReducer(s, { type: "NEXT_STEP" });

    // Assert
    expect(next.phase).toBe("complete");
  });
});

describe("thompsonReducer — AUTO_STEP", () => {
  it("fills in the correct template automatically", () => {
    // Arrange: step 0 for "a" expects "symbol"
    const started = thompsonReducer(initialThompsonState, {
      type: "START",
      payload: "a",
    });

    // Act
    const next = thompsonReducer(started, { type: "AUTO_STEP" });

    // Assert
    expect(next.userTemplate).toBe("symbol");
    expect(next.isTemplateCorrect).toBe(true);
  });

  it("returns state unchanged when there is no current step (idle phase)", () => {
    // Act
    const next = thompsonReducer(initialThompsonState, { type: "AUTO_STEP" });

    // Assert
    expect(next).toBe(initialThompsonState);
  });
});

describe("thompsonReducer — RESET", () => {
  it("returns the initial state regardless of previous progress", () => {
    // Arrange: mid-construction state
    let s = thompsonReducer(initialThompsonState, {
      type: "START",
      payload: "a+b",
    });
    s = thompsonReducer(s, { type: "SELECT_TEMPLATE", payload: "symbol" });

    // Act
    const next = thompsonReducer(s, { type: "RESET" });

    // Assert
    expect(next).toEqual(initialThompsonState);
  });
});

describe("thompsonReducer — default case", () => {
  it("returns the same state reference for an unknown action type", () => {
    const next = thompsonReducer(initialThompsonState, {
      type: "UNKNOWN_ACTION",
    } as never);
    expect(next).toBe(initialThompsonState);
  });
});
