import { describe, it, expect } from "vitest";
import {
  concatenate,
  union,
  star,
  eliminationFormula,
  normalize,
  regexEquals,
} from "../regexUtils";
import { EPSILON, EMPTY_SET } from "../types";

describe("concatenate", () => {
  it("returns ∅ when either operand is ∅", () => {
    expect(concatenate(EMPTY_SET, "a")).toBe(EMPTY_SET);
    expect(concatenate("a", EMPTY_SET)).toBe(EMPTY_SET);
    expect(concatenate(EMPTY_SET, EMPTY_SET)).toBe(EMPTY_SET);
  });

  it("returns the other operand when one is ε (identity)", () => {
    expect(concatenate(EPSILON, "a")).toBe("a");
    expect(concatenate("a", EPSILON)).toBe("a");
    expect(concatenate(EPSILON, EPSILON)).toBe(EPSILON);
  });

  it("concatenates two plain symbols", () => {
    expect(concatenate("a", "b")).toBe("ab");
  });

  it("wraps operand in parens when it contains a top-level union", () => {
    expect(concatenate("a+b", "c")).toBe("(a+b)c");
    expect(concatenate("c", "a+b")).toBe("c(a+b)");
    expect(concatenate("a+b", "c+d")).toBe("(a+b)(c+d)");
  });

  it("does not wrap starred or plain multi-char expressions unnecessarily", () => {
    expect(concatenate("a*", "b")).toBe("a*b");
    expect(concatenate("ab", "cd")).toBe("abcd");
  });
});

describe("union", () => {
  it("returns the other operand when one is ∅ (identity)", () => {
    expect(union(EMPTY_SET, "a")).toBe("a");
    expect(union("a", EMPTY_SET)).toBe("a");
    expect(union(EMPTY_SET, EMPTY_SET)).toBe(EMPTY_SET);
  });

  it("returns the operand unchanged when both are equal", () => {
    expect(union("a", "a")).toBe("a");
    expect(union("a+b", "a+b")).toBe("a+b");
  });

  it("formats as a+b for distinct operands", () => {
    expect(union("a", "b")).toBe("a+b");
    expect(union("ab", "cd")).toBe("ab+cd");
  });
});

describe("star", () => {
  it("returns ε for both ε* and ∅*", () => {
    expect(star(EPSILON)).toBe(EPSILON);
    expect(star(EMPTY_SET)).toBe(EPSILON);
  });

  it("appends * to a single character", () => {
    expect(star("a")).toBe("a*");
    expect(star("b")).toBe("b*");
  });

  it("does not double-star an already-starred single char expression", () => {
    expect(star("a*")).toBe("a*");
  });

  it("wraps multi-char expressions in parens before starring", () => {
    expect(star("ab")).toBe("(ab)*");
    expect(star("a+b")).toBe("(a+b)*");
  });

  it("does not re-wrap an already-parenthesised expression", () => {
    expect(star("(a+b)")).toBe("(a+b)*");
  });
});

describe("eliminationFormula — R4 + R1·R2*·R3", () => {
  it("easy: all ∅ — returns ∅", () => {
    expect(eliminationFormula(EMPTY_SET, EMPTY_SET, EMPTY_SET, EMPTY_SET)).toBe(
      EMPTY_SET,
    );
  });

  it("easy: no self-loop, no R4 — returns R1·R3", () => {
    // R4=∅, R2=∅ → R2*=ε → R1·ε·R3 = R1·R3
    expect(eliminationFormula("a", EMPTY_SET, "b", EMPTY_SET)).toBe("ab");
  });

  it("medium: ε-transitions absorbed — concatenation simplifies correctly", () => {
    // R1=ε, R2=∅, R3=a, R4=∅ → ε·ε·a = a
    expect(eliminationFormula(EPSILON, EMPTY_SET, "a", EMPTY_SET)).toBe("a");
  });

  it("medium: existing R4 is unioned with new path", () => {
    // R1=ε, R2=∅, R3=b, R4=a → union(a, b) = a+b
    expect(eliminationFormula(EPSILON, EMPTY_SET, "b", "a")).toBe("a+b");
  });

  it("hard: self-loop produces Kleene star in result", () => {
    // R1=ε, R2=a, R3=b, R4=∅ → ε·a*·b = a*b
    expect(eliminationFormula(EPSILON, "a", "b", EMPTY_SET)).toBe("a*b");
  });

  it("hard: self-loop with existing R4", () => {
    // R1=a*b, R2=b, R3=ε, R4=∅ → a*b·b*·ε = a*bb*
    expect(eliminationFormula("a*b", "b", EPSILON, EMPTY_SET)).toBe("a*bb*");
  });

  it("very hard: complex nested expressions", () => {
    // R1=(a+b), R2=c, R3=(d+e), R4=∅ → (a+b)c*(d+e)
    expect(eliminationFormula("a+b", "c", "d+e", EMPTY_SET)).toBe(
      "(a+b)c*(d+e)",
    );
  });
});

describe("normalize", () => {
  it("strips whitespace", () => {
    expect(normalize("a + b")).toBe("a + b".replace(/\s/g, ""));
  });

  it("strips redundant outer parentheses", () => {
    expect(normalize("(a)")).toBe("a");
    expect(normalize("((ab))")).toBe("ab");
  });

  it("does not strip parens that are load-bearing", () => {
    expect(normalize("(a+b)c")).toBe("(a+b)c");
  });
});

describe("regexEquals", () => {
  it("returns true for identical strings", () => {
    expect(regexEquals("a", "a")).toBe(true);
    expect(regexEquals("a+b", "a+b")).toBe(true);
  });

  it("returns true after stripping redundant parens", () => {
    expect(regexEquals("(a)", "a")).toBe(true);
    expect(regexEquals("((ab))", "ab")).toBe(true);
  });

  it("returns false for structurally different expressions", () => {
    expect(regexEquals("a", "b")).toBe(false);
    expect(regexEquals("a+b", "b+a")).toBe(false);
    expect(regexEquals("ab", "a+b")).toBe(false);
  });

  it("returns false when one has star and the other does not", () => {
    expect(regexEquals("a*", "a")).toBe(false);
  });
});

// ---- findMatchingParen returning -1 (lines 122-123) ----

describe("findMatchingParen — unclosed parenthesis edge case", () => {
  it("normalize leaves an unclosed-paren expression unchanged", () => {
    // findMatchingParen returns -1 for "(ab" → stripOuterParens leaves it alone
    expect(normalize("(ab")).toBe("(ab");
  });

  it("star wraps an unclosed-paren string in outer parens (no added closing paren)", () => {
    // needsParensForStar('(ab'): starts with '(' but findMatchingParen returns -1 → needs parens
    // The function wraps as-is: '(' + '(ab' + ')*' = '((ab)*'
    expect(star("(ab")).toBe("((ab)*");
  });
});

// ---- Complex concatenate ----

describe("concatenate — complex expressions", () => {
  it("handles a starred group on the left (no extra parens needed)", () => {
    expect(concatenate("(a+b)*", "c")).toBe("(a+b)*c");
  });

  it("wraps both sides when both contain top-level unions", () => {
    expect(concatenate("a+b+c", "x+y")).toBe("(a+b+c)(x+y)");
  });

  it("wraps left union-of-stars expression", () => {
    expect(concatenate("a*+b*", "c")).toBe("(a*+b*)c");
  });

  it("handles deeply nested concat without unnecessary parens", () => {
    // Neither 'a*b' nor 'c*d' has a top-level union
    expect(concatenate("a*b", "c*d")).toBe("a*bc*d");
  });
});

// ---- Complex union ----

describe("union — complex expressions", () => {
  it("creates a three-way union via chaining", () => {
    expect(union(union("a", "b"), "c")).toBe("a+b+c");
  });

  it("handles union of complex subexpressions", () => {
    expect(union("a*b", "c+d")).toBe("a*b+c+d");
  });

  it("deduplicates complex equal expressions", () => {
    expect(union("a*b", "a*b")).toBe("a*b");
  });
});

// ---- Complex star ----

describe("star — complex expressions", () => {
  it('does not re-star an already-starred parenthesised group "(a+b)*"', () => {
    expect(star("(a+b)*")).toBe("(a+b)*");
  });

  it("wraps multi-symbol concat expression in parens", () => {
    expect(star("abc")).toBe("(abc)*");
  });

  it("wraps a union-of-stars expression", () => {
    expect(star("a*+b*")).toBe("(a*+b*)*");
  });
});

// ---- Complex eliminationFormula ----

describe("eliminationFormula — all four R-values non-empty", () => {
  it("very hard: R1=a, R2=b, R3=c, R4=d → d+ab*c", () => {
    expect(eliminationFormula("a", "b", "c", "d")).toBe("d+ab*c");
  });

  it("very hard: union R1 and ε R3 → (a+b)(c+d)*", () => {
    expect(eliminationFormula("a+b", "c+d", EPSILON, EMPTY_SET)).toBe(
      "(a+b)(c+d)*",
    );
  });

  it("very hard: all union expressions → (a+b)(c+d)*(e+f)+g", () => {
    expect(eliminationFormula("a+b", "c+d", "e+f", "g")).toBe(
      "g+(a+b)(c+d)*(e+f)",
    );
  });
});
