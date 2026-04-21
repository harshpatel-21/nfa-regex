import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildThompsonSteps, printAST, testParse } from '../thompson'
import { EPSILON } from '../types'

afterEach(() => {
  vi.restoreAllMocks()
})

// buildThompsonSteps resets its own counters on each call.

describe('buildThompsonSteps — error handling', () => {
  it('returns an error for an empty string', () => {
    const { steps, error } = buildThompsonSteps('')
    expect(steps).toHaveLength(0)
    expect(error).toBeDefined()
  })

  it('returns an error for an invalid character', () => {
    const { error } = buildThompsonSteps('@')
    expect(error).toBeDefined()
  })

  it('returns an error for unmatched parenthesis', () => {
    const { error } = buildThompsonSteps('(ab')
    expect(error).toBeDefined()
  })

  it('returns an error when parsing succeeds but input has unconsumed trailing characters (e.g. "a)")', () => {
    // parseExpr consumes 'a', then ')' remains unconsumed → triggers the trailing-char check
    const { steps, error } = buildThompsonSteps('a)')
    expect(steps).toHaveLength(0)
    expect(error).toBeDefined()
    expect(error).toContain('Unexpected character')
  })

  it('returns an unexpected-end error for incomplete expressions like "a+"', () => {
    const { error } = buildThompsonSteps('a+')
    expect(error).toMatch(/Unexpected end of expression/i)
  })
})

describe('debug utilities', () => {
  it('printAST logs node structure without throwing', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { steps } = buildThompsonSteps('a')
    const step = steps[0]!

    const pseudoAst = {
      type: 'symbol' as const,
      char: 'a',
      start: step.subExprStart,
      end: step.subExprEnd,
    }

    expect(() => printAST(pseudoAst)).not.toThrow()
    expect(logSpy).toHaveBeenCalled()
  })

  it('testParse logs success path for valid regex', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    testParse('ab')
    expect(logSpy).toHaveBeenCalled()
  })

  it('testParse logs error path for invalid regex', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    testParse('@')
    expect(errorSpy).toHaveBeenCalled()
  })
})

// ---- Easy: single symbol ----

describe('easy — single symbol "a"', () => {
  it('produces exactly 1 step', () => {
    const { steps } = buildThompsonSteps('a')
    expect(steps).toHaveLength(1)
  })

  it('step has template "symbol" and subExpr "a"', () => {
    const { steps } = buildThompsonSteps('a')
    expect(steps[0]!.template).toBe('symbol')
    expect(steps[0]!.subExpr).toBe('a')
  })

  it('final NFA has 2 states and 1 transition labelled "a"', () => {
    const { steps } = buildThompsonSteps('a')
    const nfa = steps[0]!.nfaAfter
    expect(nfa.states).toHaveLength(2)
    expect(nfa.transitions).toHaveLength(1)
    expect(nfa.transitions[0]!.symbol).toBe('a')
  })

  it('alphabet contains "a"', () => {
    const { steps } = buildThompsonSteps('a')
    expect(steps.at(-1)!.nfaAfter.alphabet).toContain('a')
  })

  it('fragment start and final IDs differ (two distinct states)', () => {
    const { steps } = buildThompsonSteps('a')
    expect(steps[0]!.fragmentStartId).not.toBe(steps[0]!.fragmentFinalId)
  })
})

// ---- Easy: epsilon ----

describe('easy — epsilon "ε"', () => {
  it('produces 1 step with template "epsilon"', () => {
    const { steps } = buildThompsonSteps(EPSILON)
    expect(steps).toHaveLength(1)
    expect(steps[0]!.template).toBe('epsilon')
  })

  it('final NFA has 2 states and 1 ε-transition', () => {
    const { steps } = buildThompsonSteps(EPSILON)
    const nfa = steps[0]!.nfaAfter
    expect(nfa.states).toHaveLength(2)
    expect(nfa.transitions[0]!.symbol).toBe(EPSILON)
  })
})

// ---- Medium: concatenation ----

describe('medium — concatenation "ab"', () => {
  it('produces 3 steps: symbol a, symbol b, concat', () => {
    const { steps } = buildThompsonSteps('ab')
    expect(steps).toHaveLength(3)
    expect(steps[0]!.template).toBe('symbol')
    expect(steps[1]!.template).toBe('symbol')
    expect(steps[2]!.template).toBe('concat')
  })

  it('concat step covers the full expression', () => {
    const { steps } = buildThompsonSteps('ab')
    expect(steps[2]!.subExpr).toBe('ab')
  })

  it('concat step adds exactly 1 new ε-transition and 0 new states', () => {
    const { steps } = buildThompsonSteps('ab')
    expect(steps[2]!.newStateIds).toHaveLength(0)
    expect(steps[2]!.newTransitionIds).toHaveLength(1)
    expect(steps[2]!.expectedTransitions[0]!.symbol).toBe(EPSILON)
  })

  it('final NFA has 4 states and 3 transitions', () => {
    const { steps } = buildThompsonSteps('ab')
    const nfa = steps.at(-1)!.nfaAfter
    expect(nfa.states).toHaveLength(4)
    expect(nfa.transitions).toHaveLength(3)
  })

  it('alphabet contains both "a" and "b"', () => {
    const { steps } = buildThompsonSteps('ab')
    const alpha = steps.at(-1)!.nfaAfter.alphabet
    expect(alpha).toContain('a')
    expect(alpha).toContain('b')
  })
})

// ---- Medium: Kleene star ----

describe('medium — Kleene star "a*"', () => {
  it('produces 2 steps: symbol a, then star', () => {
    const { steps } = buildThompsonSteps('a*')
    expect(steps).toHaveLength(2)
    expect(steps[0]!.template).toBe('symbol')
    expect(steps[1]!.template).toBe('star')
  })

  it('star step adds 1 new state (the loop state) and 2 ε-transitions', () => {
    const { steps } = buildThompsonSteps('a*')
    expect(steps[1]!.newStateIds).toHaveLength(1)
    expect(steps[1]!.newTransitionIds).toHaveLength(2)
  })

  it('star fragment start and final are the same state', () => {
    const { steps } = buildThompsonSteps('a*')
    expect(steps[1]!.fragmentStartId).toBe(steps[1]!.fragmentFinalId)
  })

  it('final NFA has 3 states and 3 transitions', () => {
    const { steps } = buildThompsonSteps('a*')
    const nfa = steps.at(-1)!.nfaAfter
    expect(nfa.states).toHaveLength(3)
    expect(nfa.transitions).toHaveLength(3)
  })
})

// ---- Hard: union ----

describe('hard — union "a+b"', () => {
  it('produces 3 steps: symbol a, symbol b, union', () => {
    const { steps } = buildThompsonSteps('a+b')
    expect(steps).toHaveLength(3)
    expect(steps[2]!.template).toBe('union')
  })

  it('union step covers the full expression', () => {
    const { steps } = buildThompsonSteps('a+b')
    expect(steps[2]!.subExpr).toBe('a+b')
  })

  it('union step adds 2 new states and 4 ε-transitions', () => {
    const { steps } = buildThompsonSteps('a+b')
    expect(steps[2]!.newStateIds).toHaveLength(2)
    expect(steps[2]!.newTransitionIds).toHaveLength(4)
  })

  it('final NFA has 6 states and 6 transitions', () => {
    const { steps } = buildThompsonSteps('a+b')
    const nfa = steps.at(-1)!.nfaAfter
    expect(nfa.states).toHaveLength(6)
    expect(nfa.transitions).toHaveLength(6)
  })

  it('all 4 union ε-transitions are labelled ε', () => {
    const { steps } = buildThompsonSteps('a+b')
    const unionStep = steps[2]!
    expect(unionStep.expectedTransitions.every(t => t.symbol === EPSILON)).toBe(true)
  })
})

// ---- Very Hard: nested — "(a+b)*c" ----

describe('very hard — "(a+b)*c"', () => {
  it('produces 6 steps in correct post-order: a, b, union, star, c, concat', () => {
    const { steps } = buildThompsonSteps('(a+b)*c')
    expect(steps).toHaveLength(6)
    expect(steps[0]!.template).toBe('symbol') // a
    expect(steps[1]!.template).toBe('symbol') // b
    expect(steps[2]!.template).toBe('union')  // a+b
    expect(steps[3]!.template).toBe('star')   // (a+b)*
    expect(steps[4]!.template).toBe('symbol') // c
    expect(steps[5]!.template).toBe('concat') // (a+b)*c
  })

  it('subExpr on each step matches the correct regex substring', () => {
    const { steps } = buildThompsonSteps('(a+b)*c')
    expect(steps[0]!.subExpr).toBe('a')
    expect(steps[1]!.subExpr).toBe('b')
    // The union node's range is extended to include the surrounding parens
    expect(steps[2]!.subExpr).toBe('(a+b)')
    expect(steps[3]!.subExpr).toBe('(a+b)*')
    expect(steps[4]!.subExpr).toBe('c')
    expect(steps[5]!.subExpr).toBe('(a+b)*c')
  })

  it('final NFA has 9 states and 10 transitions', () => {
    const { steps } = buildThompsonSteps('(a+b)*c')
    const nfa = steps.at(-1)!.nfaAfter
    expect(nfa.states).toHaveLength(9)
    expect(nfa.transitions).toHaveLength(10)
  })

  it('alphabet contains a, b, and c', () => {
    const { steps } = buildThompsonSteps('(a+b)*c')
    const alpha = steps.at(-1)!.nfaAfter.alphabet
    expect(alpha).toContain('a')
    expect(alpha).toContain('b')
    expect(alpha).toContain('c')
  })
})

// ---- Very Hard: pipe-style union and double star ----

describe(' "a**" (double star is idempotent)', () => {
  it('parses without error', () => {
    const { error } = buildThompsonSteps('a**')
    expect(error).toBeUndefined()
  })

  it('the outer star wraps the inner star fragment — same start/final state throughout', () => {
    const { steps } = buildThompsonSteps('a**')
    expect(steps).toHaveLength(3)
    const outerStar = steps[2]!
    expect(outerStar.template).toBe('star')
    expect(outerStar.fragmentStartId).toBe(outerStar.fragmentFinalId)
  })
})

// ---- Very Hard: triple union "a+b+c" ----

describe('triple union "a+b+c"', () => {
  it('produces 5 steps in left-associative post-order: a, b, union(a+b), c, union((a+b)+c)', () => {
    const { steps } = buildThompsonSteps('a+b+c')
    expect(steps).toHaveLength(5)
    expect(steps[0]!.template).toBe('symbol') // a
    expect(steps[1]!.template).toBe('symbol') // b
    expect(steps[2]!.template).toBe('union')  // a+b
    expect(steps[3]!.template).toBe('symbol') // c
    expect(steps[4]!.template).toBe('union')  // (a+b)+c
  })

  it('subExpr of the two union steps matches the correct substrings', () => {
    const { steps } = buildThompsonSteps('a+b+c')
    expect(steps[2]!.subExpr).toBe('a+b')
    expect(steps[4]!.subExpr).toBe('a+b+c')
  })

  it('final NFA has 10 states and 11 transitions', () => {
    const { steps } = buildThompsonSteps('a+b+c')
    const nfa = steps.at(-1)!.nfaAfter
    expect(nfa.states).toHaveLength(10)
    expect(nfa.transitions).toHaveLength(11)
  })

  it('alphabet contains a, b, and c', () => {
    const { steps } = buildThompsonSteps('a+b+c')
    const alpha = steps.at(-1)!.nfaAfter.alphabet
    expect(alpha).toContain('a')
    expect(alpha).toContain('b')
    expect(alpha).toContain('c')
  })
})

// ---- Very Hard: union of unions "(a+b)(c+d)" ----

describe('union-product "(a+b)(c+d)"', () => {
  it('produces 7 steps: a, b, union(a+b), c, d, union(c+d), concat', () => {
    const { steps } = buildThompsonSteps('(a+b)(c+d)')
    expect(steps).toHaveLength(7)
    expect(steps[0]!.template).toBe('symbol')
    expect(steps[1]!.template).toBe('symbol')
    expect(steps[2]!.template).toBe('union')
    expect(steps[3]!.template).toBe('symbol')
    expect(steps[4]!.template).toBe('symbol')
    expect(steps[5]!.template).toBe('union')
    expect(steps[6]!.template).toBe('concat')
  })

  it('union subExpr values are "(a+b)" and "(c+d)"', () => {
    const { steps } = buildThompsonSteps('(a+b)(c+d)')
    expect(steps[2]!.subExpr).toBe('(a+b)')
    expect(steps[5]!.subExpr).toBe('(c+d)')
    expect(steps[6]!.subExpr).toBe('(a+b)(c+d)')
  })

  it('final NFA has 12 states and 13 transitions', () => {
    const { steps } = buildThompsonSteps('(a+b)(c+d)')
    const nfa = steps.at(-1)!.nfaAfter
    expect(nfa.states).toHaveLength(12)
    expect(nfa.transitions).toHaveLength(13)
  })
})

// ---- Hard: pipe-style union "a+b" ----

describe('pipe-style union "a+b"', () => {
  it('parses without error and produces 3 steps', () => {
    const { steps, error } = buildThompsonSteps('a|b')
    expect(error).toBeUndefined()
    expect(steps).toHaveLength(3)
    expect(steps[2]!.template).toBe('union')
  })

  it('subExpr on union step is "a|b" (preserves pipe character)', () => {
    const { steps } = buildThompsonSteps('a|b')
    expect(steps[2]!.subExpr).toBe('a|b')
  })

  it('produces same NFA structure as "a+b": 6 states, 6 transitions', () => {
    const { steps } = buildThompsonSteps('a|b')
    const nfa = steps.at(-1)!.nfaAfter
    expect(nfa.states).toHaveLength(6)
    expect(nfa.transitions).toHaveLength(6)
  })
})

// ---- Hard: union with epsilon "a+ε" ----

describe('hard — union with epsilon "a+ε"', () => {
  it('parses without error and produces 3 steps', () => {
    const { steps, error } = buildThompsonSteps(`a+${EPSILON}`)
    expect(error).toBeUndefined()
    expect(steps).toHaveLength(3)
    expect(steps[1]!.template).toBe('epsilon')
    expect(steps[2]!.template).toBe('union')
  })

  it('alphabet contains only "a" (epsilon not in alphabet)', () => {
    const { steps } = buildThompsonSteps(`a+${EPSILON}`)
    const alpha = steps.at(-1)!.nfaAfter.alphabet
    expect(alpha).toContain('a')
    expect(alpha).not.toContain(EPSILON)
  })
})

// ---- Very Hard: deeply nested "a*(b+c)*d" ----

describe('very hard — "a*(b+c)*d"', () => {
  it('produces 9 steps in correct post-order', () => {
    const { steps } = buildThompsonSteps('a*(b+c)*d')
    expect(steps).toHaveLength(9)
    expect(steps[0]!.template).toBe('symbol') // a
    expect(steps[1]!.template).toBe('star')   // a*
    expect(steps[2]!.template).toBe('symbol') // b
    expect(steps[3]!.template).toBe('symbol') // c
    expect(steps[4]!.template).toBe('union')  // b+c
    expect(steps[5]!.template).toBe('star')   // (b+c)*
    expect(steps[6]!.template).toBe('concat') // a*(b+c)*
    expect(steps[7]!.template).toBe('symbol') // d
    expect(steps[8]!.template).toBe('concat') // a*(b+c)*d
  })

  it('subExpr on each step matches the correct regex substring', () => {
    const { steps } = buildThompsonSteps('a*(b+c)*d')
    expect(steps[0]!.subExpr).toBe('a')
    expect(steps[1]!.subExpr).toBe('a*')
    expect(steps[2]!.subExpr).toBe('b')
    expect(steps[3]!.subExpr).toBe('c')
    expect(steps[4]!.subExpr).toBe('(b+c)')
    expect(steps[5]!.subExpr).toBe('(b+c)*')
    expect(steps[6]!.subExpr).toBe('a*(b+c)*')
    expect(steps[7]!.subExpr).toBe('d')
    expect(steps[8]!.subExpr).toBe('a*(b+c)*d')
  })

  it('final NFA has 12 states and 14 transitions', () => {
    const { steps } = buildThompsonSteps('a*(b+c)*d')
    const nfa = steps.at(-1)!.nfaAfter
    expect(nfa.states).toHaveLength(12)
    expect(nfa.transitions).toHaveLength(14)
  })

  it('alphabet contains a, b, c, and d', () => {
    const { steps } = buildThompsonSteps('a*(b+c)*d')
    const alpha = steps.at(-1)!.nfaAfter.alphabet
    expect(alpha).toContain('a')
    expect(alpha).toContain('b')
    expect(alpha).toContain('c')
    expect(alpha).toContain('d')
  })
})
