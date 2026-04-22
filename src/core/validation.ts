import type { NFA, ValidationError } from "./types";
import { regexEquals } from "./regexUtils";

/**
 * Validate an NFA is well-formed for conversion.
 */
export function validateNFA(nfa: NFA): ValidationError[] {
  const errors: ValidationError[] = [];

  const startStates = nfa.states.filter((s) => s.isStart);
  if (startStates.length === 0) {
    errors.push({ field: "states", message: "NFA must have a start state" });
  } else if (startStates.length > 1) {
    errors.push({
      field: "states",
      message: "NFA must have exactly one start state",
    });
  }

  const finalStates = nfa.states.filter((s) => s.isFinal);
  if (finalStates.length === 0) {
    errors.push({
      field: "states",
      message: "NFA must have at least one final/accept state",
    });
  }

  if (nfa.states.length === 0) {
    errors.push({
      field: "states",
      message: "NFA must have at least one state",
    });
  }

  // Check for duplicate state IDs
  const stateIds = new Set<string>();
  for (const state of nfa.states) {
    if (stateIds.has(state.id)) {
      errors.push({
        field: "states",
        message: `Duplicate state ID: ${state.id}`,
      });
    }
    stateIds.add(state.id);
  }

  // Check transitions reference valid states
  for (const t of nfa.transitions) {
    if (!stateIds.has(t.source)) {
      errors.push({
        field: "transitions",
        message: `Transition source "${t.source}" does not match any state`,
      });
    }
    if (!stateIds.has(t.target)) {
      errors.push({
        field: "transitions",
        message: `Transition target "${t.target}" does not match any state`,
      });
    }
  }

  return errors;
}

/**
 * Validate user-entered regex against the expected result.
 */
export function validateUserRegex(
  userInput: string,
  expected: string,
): boolean {
  return regexEquals(userInput, expected);
}
