import type {
  NFA,
  State,
  Transition,
  ThompsonStep,
  ThompsonTemplate,
  ThompsonTransitionRow,
} from "./types";
import { EPSILON } from "./types";

// ---- Private module counters (reset per build) ----

// Recursive-descent parser + post-order step builder

let stateCounter = 0;
let transitionCounter = 0;

function newStateId(): string {
  return `th_s${stateCounter++}`;
}
function newTransId(): string {
  return `th_t${transitionCounter++}`;
}

// ---- AST types (internal) ----

type SymbolNode = { type: "symbol"; char: string; start: number; end: number };
type EpsilonNode = { type: "epsilon"; start: number; end: number };
type UnionNode = {
  type: "union";
  left: ASTNode;
  right: ASTNode;
  start: number;
  end: number;
};
type ConcatNode = {
  type: "concat";
  left: ASTNode;
  right: ASTNode;
  start: number;
  end: number;
};
type StarNode = { type: "star"; operand: ASTNode; start: number; end: number };
type ASTNode = SymbolNode | EpsilonNode | UnionNode | ConcatNode | StarNode;

// ---- Recursive-descent parser ----

interface ParserState {
  input: string;
  pos: number;
}

/**
 * Order of precedence goes:
 * 1. symbols and ε (handled in parseAtom)
 * 2. Kleene-Star (handled in parseFactor)
 * 3. Concatenation (handled in parseTerm)
 * 4. Union (handled in parseExpr)
 *
 * Each function parses components of its precedence level and calls higher precedence functions as needed.
 */
function parseExpr(p: ParserState): ASTNode {
  const start = p.pos;
  let node = parseTerm(p);

  // Loop until we hit end of input or a closing parenthesis, accumulating unions
  while (
    p.pos < p.input.length &&
    (p.input[p.pos] === "+" || p.input[p.pos] === "|")
  ) {
    p.pos++;
    const right = parseTerm(p);
    node = { type: "union", left: node, right, start, end: right.end };
  }
  return node;
}

function parseTerm(p: ParserState): ASTNode {
  let node = parseFactor(p);

  // Keep finding concatenated factors
  while (
    p.pos < p.input.length &&
    p.input[p.pos] !== ")" &&
    p.input[p.pos] !== "+" &&
    p.input[p.pos] !== "|"
  ) {
    const right = parseFactor(p);
    node = {
      type: "concat",
      left: node,
      right,
      start: node.start,
      end: right.end,
    };
  }
  return node;
}

function parseFactor(p: ParserState): ASTNode {
  const start = p.pos;
  let node = parseAtom(p);
  // Keep checking for Kleene stars following the atom/nested expression
  while (p.pos < p.input.length && p.input[p.pos] === "*") {
    p.pos++;
    node = { type: "star", operand: node, start, end: p.pos - 1 };
  }
  return node;
}

function parseAtom(p: ParserState): ASTNode {
  if (p.pos >= p.input.length) throw new Error("Unexpected end of expression");
  const start = p.pos;
  const ch = p.input[p.pos];

  if (!ch) throw new Error("Unexpected end of expression");

  if (ch === "(") {
    p.pos++;
    const inner = parseExpr(p);
    if (p.pos >= p.input.length || p.input[p.pos] !== ")") {
      throw new Error(`Expected ')' at position ${p.pos}`);
    }
    p.pos++;
    return { ...inner, start, end: p.pos - 1 };
  }

  if (ch === "ε") {
    p.pos++;
    return { type: "epsilon", start, end: start };
  }

  if (/[a-zA-Z0-9_]/.test(ch)) {
    p.pos++;
    return { type: "symbol", char: ch, start, end: start };
  }

  throw new Error(`Unexpected character '${ch}' at position ${start}`);
}

// ---- NFA fragment tracking ----

interface Fragment {
  startId: string;
  finalId: string;
}

function makeState(id: string, label: string): State {
  return { id, label, isStart: false, isFinal: false };
}

/**
 * Returns a copy of the NFA with only the fragment's start/final states marked.
 *
 * This is only used by the graph renderer. It needs to know which states to
 * draw as start/final at each step. It doesn't affect the construction logic
 * at all
 * */
function markFragment(nfa: NFA, startId: string, finalId: string): NFA {
  return {
    ...nfa,
    states: nfa.states.map((s) => ({
      ...s,
      isStart: s.id === startId,
      isFinal: s.id === finalId,
    })),
  };
}

interface BuildResult {
  fragment: Fragment;
  steps: ThompsonStep[];
  nfa: NFA; // accumulated NFA (states have no isStart/isFinal set — markFragment applies those)
}

// ---- Step builder (post-order AST traversal) ----

function buildSteps(
  node: ASTNode,
  input: string,
  labelCounter: { n: number },
  accumNFA: NFA,
): BuildResult {
  switch (node.type) {
    case "symbol":
    case "epsilon": {
      const sId = newStateId();
      const fId = newStateId();
      const sLabel = `q${labelCounter.n++}`;
      const fLabel = `q${labelCounter.n++}`;
      const sym = node.type === "symbol" ? node.char : EPSILON;

      const s: State = makeState(sId, sLabel);
      const f: State = makeState(fId, fLabel);
      const t: Transition = {
        id: newTransId(),
        source: sId,
        target: fId,
        symbol: sym,
      };

      const rawNFA: NFA = {
        states: [...accumNFA.states, s, f],
        transitions: [...accumNFA.transitions, t],
        alphabet: accumNFA.alphabet,
      };
      const nfaAfter = markFragment(rawNFA, sId, fId);

      const template: ThompsonTemplate =
        node.type === "symbol" ? "symbol" : "epsilon";
      const subExpr = input.slice(node.start, node.end + 1);
      const explanation =
        node.type === "symbol"
          ? `Base case: symbol '${node.char}'. Add start state ${sLabel} and final state ${fLabel} with a '${node.char}' transition.`
          : `Base case: ε. Add start state ${sLabel} and final state ${fLabel} with an ε-transition.`;

      const step: ThompsonStep = {
        id: `step_${sId}`,
        template,
        subExprStart: node.start,
        subExprEnd: node.end,
        subExpr,
        fragmentStartId: sId,
        fragmentFinalId: fId,
        newStateIds: [sId, fId],
        newTransitionIds: [t.id],
        nfaAfter,
        explanation,
        expectedTransitions: [
          { id: t.id, sourceLabel: sLabel, symbol: sym, targetLabel: fLabel },
        ],
      };

      return {
        fragment: { startId: sId, finalId: fId },
        steps: [step],
        nfa: rawNFA,
      };
    }

    case "union": {
      const left = buildSteps(node.left, input, labelCounter, accumNFA);
      const right = buildSteps(node.right, input, labelCounter, left.nfa);

      const qsId = newStateId();
      const qfId = newStateId();
      const qsLabel = `q${labelCounter.n++}`;
      const qfLabel = `q${labelCounter.n++}`;

      const qs: State = makeState(qsId, qsLabel);
      const qf: State = makeState(qfId, qfLabel);

      const t1: Transition = {
        id: newTransId(),
        source: qsId,
        target: left.fragment.startId,
        symbol: EPSILON,
      };
      const t2: Transition = {
        id: newTransId(),
        source: qsId,
        target: right.fragment.startId,
        symbol: EPSILON,
      };
      const t3: Transition = {
        id: newTransId(),
        source: left.fragment.finalId,
        target: qfId,
        symbol: EPSILON,
      };
      const t4: Transition = {
        id: newTransId(),
        source: right.fragment.finalId,
        target: qfId,
        symbol: EPSILON,
      };

      const rawNFA: NFA = {
        states: [...right.nfa.states, qs, qf],
        transitions: [...right.nfa.transitions, t1, t2, t3, t4],
        alphabet: right.nfa.alphabet,
      };
      const nfaAfter = markFragment(rawNFA, qsId, qfId);

      const lsLabel =
        left.nfa.states.find((s) => s.id === left.fragment.startId)?.label ??
        "?";
      const lfLabel =
        left.nfa.states.find((s) => s.id === left.fragment.finalId)?.label ??
        "?";
      const rsLabel =
        right.nfa.states.find((s) => s.id === right.fragment.startId)?.label ??
        "?";
      const rfLabel =
        right.nfa.states.find((s) => s.id === right.fragment.finalId)?.label ??
        "?";

      const subExpr = input.slice(node.start, node.end + 1);
      const explanation = `Union template for '${subExpr}'. Add new start ${qsLabel} with ε-transitions to both sub-NFA starts (${lsLabel}, ${rsLabel}), and new final ${qfLabel} receiving ε-transitions from both sub-NFA finals (${lfLabel}, ${rfLabel}).`;

      const expectedTransitions: ThompsonTransitionRow[] = [
        {
          id: t1.id,
          sourceLabel: qsLabel,
          symbol: EPSILON,
          targetLabel: lsLabel,
        },
        {
          id: t2.id,
          sourceLabel: qsLabel,
          symbol: EPSILON,
          targetLabel: rsLabel,
        },
        {
          id: t3.id,
          sourceLabel: lfLabel,
          symbol: EPSILON,
          targetLabel: qfLabel,
        },
        {
          id: t4.id,
          sourceLabel: rfLabel,
          symbol: EPSILON,
          targetLabel: qfLabel,
        },
      ];

      const step: ThompsonStep = {
        id: `step_${qsId}`,
        template: "union",
        subExprStart: node.start,
        subExprEnd: node.end,
        subExpr,
        fragmentStartId: qsId,
        fragmentFinalId: qfId,
        newStateIds: [qsId, qfId],
        newTransitionIds: [t1.id, t2.id, t3.id, t4.id],
        nfaAfter,
        explanation,
        expectedTransitions,
      };

      return {
        fragment: { startId: qsId, finalId: qfId },
        steps: [...left.steps, ...right.steps, step],
        nfa: rawNFA,
      };
    }

    case "concat": {
      const left = buildSteps(node.left, input, labelCounter, accumNFA);
      const right = buildSteps(node.right, input, labelCounter, left.nfa);

      const t: Transition = {
        id: newTransId(),
        source: left.fragment.finalId,
        target: right.fragment.startId,
        symbol: EPSILON,
      };

      const rawNFA: NFA = {
        ...right.nfa,
        transitions: [...right.nfa.transitions, t],
      };
      const nfaAfter = markFragment(
        rawNFA,
        left.fragment.startId,
        right.fragment.finalId,
      );

      const lfLabel =
        left.nfa.states.find((s) => s.id === left.fragment.finalId)?.label ??
        "?";
      const rsLabel =
        right.nfa.states.find((s) => s.id === right.fragment.startId)?.label ??
        "?";

      const subExpr = input.slice(node.start, node.end + 1);
      const explanation = `Concatenation template for '${subExpr}'. Connect the final state of the left sub-NFA (${lfLabel}) to the start state of the right sub-NFA (${rsLabel}) via an ε-transition.`;

      const step: ThompsonStep = {
        id: `step_concat_${t.id}`,
        template: "concat",
        subExprStart: node.start,
        subExprEnd: node.end,
        subExpr,
        fragmentStartId: left.fragment.startId,
        fragmentFinalId: right.fragment.finalId,
        newStateIds: [],
        newTransitionIds: [t.id],
        nfaAfter,
        explanation,
        expectedTransitions: [
          {
            id: t.id,
            sourceLabel: lfLabel,
            symbol: EPSILON,
            targetLabel: rsLabel,
          },
        ],
      };

      return {
        fragment: {
          startId: left.fragment.startId,
          finalId: right.fragment.finalId,
        },
        steps: [...left.steps, ...right.steps, step],
        nfa: rawNFA,
      };
    }

    case "star": {
      const child = buildSteps(node.operand, input, labelCounter, accumNFA);

      const qsId = newStateId();
      const qsLabel = `q${labelCounter.n++}`;
      const qs: State = makeState(qsId, qsLabel);

      const t1: Transition = {
        id: newTransId(),
        source: qsId,
        target: child.fragment.startId,
        symbol: EPSILON,
      };
      const t2: Transition = {
        id: newTransId(),
        source: child.fragment.finalId,
        target: qsId,
        symbol: EPSILON,
      };

      const rawNFA: NFA = {
        states: [...child.nfa.states, qs],
        transitions: [...child.nfa.transitions, t1, t2],
        alphabet: child.nfa.alphabet,
      };
      // For star, start and final are the same state (qsId)
      const nfaAfter = markFragment(rawNFA, qsId, qsId);

      const csLabel =
        child.nfa.states.find((s) => s.id === child.fragment.startId)?.label ??
        "?";
      const cfLabel =
        child.nfa.states.find((s) => s.id === child.fragment.finalId)?.label ??
        "?";

      const subExpr = input.slice(node.start, node.end + 1);
      const explanation = `Kleene Star template for '${subExpr}'. Add new state ${qsLabel} (both start and final, allowing zero repetitions). ε-transition forward (${qsLabel} → ${csLabel}) enters the sub-NFA; ε-transition back (${cfLabel} → ${qsLabel}) allows repetition.`;

      const step: ThompsonStep = {
        id: `step_${qsId}`,
        template: "star",
        subExprStart: node.start,
        subExprEnd: node.end,
        subExpr,
        fragmentStartId: qsId,
        fragmentFinalId: qsId,
        newStateIds: [qsId],
        newTransitionIds: [t1.id, t2.id],
        nfaAfter,
        explanation,
        expectedTransitions: [
          {
            id: t1.id,
            sourceLabel: qsLabel,
            symbol: EPSILON,
            targetLabel: csLabel,
          },
          {
            id: t2.id,
            sourceLabel: cfLabel,
            symbol: EPSILON,
            targetLabel: qsLabel,
          },
        ],
      };

      return {
        fragment: { startId: qsId, finalId: qsId },
        steps: [...child.steps, step],
        nfa: rawNFA,
      };
    }
  }
}

// ---- Public API ----

export function buildThompsonSteps(regex: string): {
  steps: ThompsonStep[];
  error?: string;
} {
  stateCounter = 0;
  transitionCounter = 0;

  const cleaned = regex.trim().replace(/\s/g, "");
  if (!cleaned) return { steps: [], error: "Empty expression" };

  const p: ParserState = { input: cleaned, pos: 0 };
  let ast: ASTNode;

  try {
    ast = parseExpr(p);
    if (p.pos < p.input.length) {
      throw new Error(
        `Unexpected character '${p.input[p.pos]}' at position ${p.pos}`,
      );
    }
  } catch (e) {
    return { steps: [], error: (e as Error).message };
  }

  // Collect alphabet from AST
  const alphabet = collectAlphabet(ast);

  const emptyNFA: NFA = { states: [], transitions: [], alphabet };
  const labelCounter = { n: 0 };

  const { steps } = buildSteps(ast, cleaned, labelCounter, emptyNFA);

  return { steps };
}

function collectAlphabet(node: ASTNode): string[] {
  switch (node.type) {
    case "symbol":
      return [node.char];
    case "epsilon":
      return [];
    case "union":
    case "concat":
      return [
        ...new Set([
          ...collectAlphabet(node.left),
          ...collectAlphabet(node.right),
        ]),
      ];
    case "star":
      return collectAlphabet(node.operand);
  }
}

// // test function to visualize the AST
// function printAST(node: ASTNode, indent = 0): void {
//   const padding = ' '.repeat(indent)
//   switch (node.type) {
//     case 'symbol':
//       console.log(`${padding}Symbol('${node.char}') [${node.start}, ${node.end}]`)
//       break
//     case 'epsilon':
//       console.log(`${padding}Epsilon [${node.start}, ${node.end}]`)
//       break
//     case 'union':
//       console.log(`${padding}Union [${node.start}, ${node.end}]`)
//       printAST(node.left, indent + 2)
//       printAST(node.right, indent + 2)
//       break
//     case 'concat':
//       console.log(`${padding}Concat [${node.start}, ${node.end}]`)
//       printAST(node.left, indent + 2)
//       printAST(node.right, indent + 2)
//       break
//     case 'star':
//       console.log(`${padding}Star [${node.start}, ${node.end}]`)
//       printAST(node.operand, indent + 2)
//       break
//   }
// }

// // test function that stores a regex and prints the AST
// function testParse(regex: string): void {
//   const result = buildThompsonSteps(regex)
//   if (result.error) {
//     console.error(`Error parsing regex: ${result.error}`)
//   } else {
//     console.log(`Successfully parsed regex: '${regex}'`)
//     console.log('Generated steps:')
//     result.steps.forEach((step, index) => {
//       console.log(`Step ${index + 1}: ${step.explanation}`)
//     })
//   }
// }
