import { EPSILON, EMPTY_SET } from "./types";

/**
 * Concatenate two regex strings, handling ε and ∅ identities.
 * ε · x = x, x · ε = x, ∅ · x = ∅, x · ∅ = ∅
 */
export function concatenate(a: string, b: string): string {
  if (a === EMPTY_SET || b === EMPTY_SET) return EMPTY_SET;
  if (a === EPSILON) return b;
  if (b === EPSILON) return a;

  const wrappedA = needsParensForConcat(a) ? `(${a})` : a;
  const wrappedB = needsParensForConcat(b) ? `(${b})` : b;
  return `${wrappedA}${wrappedB}`;
}

/**
 * Union (alternation) of two regex strings.
 * x + ∅ = x, ∅ + x = x
 */
export function union(a: string, b: string): string {
  if (a === EMPTY_SET) return b;
  if (b === EMPTY_SET) return a;
  if (a === b) return a;
  return `${a}+${b}`;
}

/**
 * Kleene star of a regex string.
 * ε* = ε, ∅* = ε, (x*)* = x*
 */
export function star(a: string): string {
  if (a === EPSILON || a === EMPTY_SET) return EPSILON;
  // Already starred single char or group
  if (a.length === 1) return `${a}*`;
  if (a.endsWith("*") && !needsParensForStar(a.slice(0, -1))) return a;
  // Wrap in parens if needed
  if (needsParensForStar(a)) return `(${a})*`;
  return `${a}*`;
}

/**
 * Compute the state elimination formula: R4 + (R1 · R2* · R3)
 */
export function eliminationFormula(
  R1: string,
  R2: string,
  R3: string,
  R4: string,
): string {
  const r2Star = star(R2);
  const middle = concatenate(concatenate(R1, r2Star), R3);
  return union(R4, middle);
}

/**
 * Normalize a regex string by applying simplification rules.
 * This is structural normalization, not semantic equivalence.
 */
export function normalize(regex: string): string {
  let result = regex;

  // Remove whitespace
  result = result.replace(/\s/g, "");

  // Replace ε concatenation patterns
  result = result.replace(/ε/g, EPSILON);
  result = result.replace(/∅/g, EMPTY_SET);

  // Remove redundant outer parentheses
  result = stripOuterParens(result);

  return result;
}

/**
 * Compare two regex strings for structural equivalence after normalization.
 */
export function regexEquals(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

// --- Helper functions ---

function needsParensForConcat(expr: string): boolean {
  if (expr.length <= 1) return false;
  // If expression contains a top-level union (+), it needs parens
  return hasTopLevelUnion(expr);
}

function needsParensForStar(expr: string): boolean {
  if (expr.length <= 1) return false;
  // Already parenthesized
  if (expr.startsWith("(") && findMatchingParen(expr, 0) === expr.length - 1) {
    return false;
  }
  return true;
}

/**
 * Return true if the expression contains a '+' at depth 0 (not inside parentheses).
 */
function hasTopLevelUnion(expr: string): boolean {
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "+" && depth === 0) return true;
  }
  return false;
}

/**
 * Find the index of the matching closing parenthesis based on the index
 */
function findMatchingParen(expr: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Repeatedly strip matched outer parentheses until none remain.
 */
function stripOuterParens(expr: string): string {
  while (
    expr.length >= 2 &&
    expr[0] === "(" &&
    findMatchingParen(expr, 0) === expr.length - 1
  ) {
    expr = expr.slice(1, -1);
  }
  return expr;
}
