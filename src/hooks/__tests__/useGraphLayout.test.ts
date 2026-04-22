import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGraphLayout } from "../useGraphLayout";
import type { NFA } from "../../core/types";

function makeNFA(
  stateIds: string[],
  transitions: NFA["transitions"] = [],
): NFA {
  return {
    states: stateIds.map((id, i) => ({
      id,
      label: id,
      isStart: i === 0,
      isFinal: i === stateIds.length - 1,
    })),
    transitions,
    alphabet: ["a"],
  };
}

describe("useGraphLayout — null input", () => {
  it("returns empty nodes and edges when nfaOrGtg is null", () => {
    // Act
    const { result } = renderHook(() => useGraphLayout(null));

    // Assert
    expect(result.current.nodes).toHaveLength(0);
    expect(result.current.edges).toHaveLength(0);
  });
});

describe("useGraphLayout — node mapping", () => {
  it("produces one node per state", () => {
    // Arrange
    const nfa = makeNFA(["q0", "q1"]);

    // Act
    const { result } = renderHook(() => useGraphLayout(nfa));

    // Assert
    expect(result.current.nodes).toHaveLength(2);
  });

  it("maps state data onto the node data field", () => {
    // Arrange
    const nfa = makeNFA(["q0", "q1"]);

    // Act
    const { result } = renderHook(() => useGraphLayout(nfa));

    // Assert
    const node = result.current.nodes.find((n) => n.id === "q0")!;
    expect(node.data.label).toBe("q0");
    expect(node.data.isStart).toBe(true);
    expect(node.type).toBe("stateNode");
  });

  it("flags the state being eliminated via highlight.stateToRemove", () => {
    // Arrange
    const nfa = makeNFA(["q0", "q1"]);
    const highlight = {
      stateToRemove: "q0",
      currentPath: null,
      highlightedR: null,
    };

    // Act
    const { result } = renderHook(() => useGraphLayout(nfa, { highlight }));

    // Assert
    const node = result.current.nodes.find((n) => n.id === "q0")!;
    expect(node.data.isBeingEliminated).toBe(true);
  });

  it("flags predecessor and successor states from the current path", () => {
    // Arrange
    const nfa = makeNFA(["q0", "q1", "q2"]);
    const currentPath = {
      from: "q0",
      to: "q2",
      R1: "a",
      R2: "∅",
      R3: "b",
      R4: "∅",
      expectedResult: "ab",
    };
    const highlight = { stateToRemove: "q1", currentPath, highlightedR: null };

    // Act
    const { result } = renderHook(() => useGraphLayout(nfa, { highlight }));

    // Assert
    const fromNode = result.current.nodes.find((n) => n.id === "q0")!;
    const toNode = result.current.nodes.find((n) => n.id === "q2")!;
    expect(fromNode.data.isPredecessor).toBe(true);
    expect(toNode.data.isSuccessor).toBe(true);
  });

  it("flags newly added Thompson states via thompsonHighlight", () => {
    // Arrange
    const nfa = makeNFA(["q0", "q1"]);
    const thompsonHighlight = { newStateIds: ["q0"], newTransitionIds: [] };

    // Act
    const { result } = renderHook(() =>
      useGraphLayout(nfa, { thompsonHighlight }),
    );

    // Assert
    const node = result.current.nodes.find((n) => n.id === "q0")!;
    expect(node.data.isNewlyAdded).toBe(true);
  });
});

describe("useGraphLayout — edge mapping", () => {
  it("produces one edge per transition", () => {
    // Arrange
    const nfa = makeNFA(
      ["q0", "q1"],
      [{ id: "t0", source: "q0", target: "q1", symbol: "a" }],
    );

    // Act
    const { result } = renderHook(() => useGraphLayout(nfa));

    // Assert
    expect(result.current.edges).toHaveLength(1);
    expect(result.current.edges[0]!.data?.symbol).toBe("a");
  });

  it("marks self-loop edges as isSelfLoop", () => {
    // Arrange
    const nfa = makeNFA(
      ["q0", "q1"],
      [{ id: "t0", source: "q0", target: "q0", symbol: "a" }],
    );

    // Act
    const { result } = renderHook(() => useGraphLayout(nfa));

    // Assert
    expect(result.current.edges[0]!.data?.isSelfLoop).toBe(true);
  });

  it("highlights R1 edge (predecessor → removed) when highlightedR is R1", () => {
    // Arrange
    const nfa = makeNFA(
      ["q0", "q1", "q2"],
      [{ id: "t0", source: "q0", target: "q1", symbol: "a" }],
    );
    const currentPath = {
      from: "q0",
      to: "q2",
      R1: "a",
      R2: "∅",
      R3: "b",
      R4: "∅",
      expectedResult: "ab",
    };
    const highlight = {
      stateToRemove: "q1",
      currentPath,
      highlightedR: "R1" as const,
    };

    // Act
    const { result } = renderHook(() => useGraphLayout(nfa, { highlight }));

    // Assert
    const edge = result.current.edges.find((e) => e.id === "t0")!;
    expect(edge.data?.isHighlighted).toBe(true);
    expect(edge.data?.isBeingRemoved).toBe(true);
  });

  it("highlights newly added Thompson transitions", () => {
    // Arrange
    const nfa = makeNFA(
      ["q0", "q1"],
      [{ id: "t0", source: "q0", target: "q1", symbol: "a" }],
    );
    const thompsonHighlight = { newStateIds: [], newTransitionIds: ["t0"] };

    // Act
    const { result } = renderHook(() =>
      useGraphLayout(nfa, { thompsonHighlight }),
    );

    // Assert
    expect(result.current.edges[0]!.data?.isHighlighted).toBe(true);
  });

  it("highlights R2 edge (self-loop on removed state) when highlightedR is R2", () => {
    // Arrange
    const nfa = makeNFA(
      ["q0", "q1", "q2"],
      [{ id: "t-loop", source: "q1", target: "q1", symbol: "b" }],
    );
    const currentPath = {
      from: "q0",
      to: "q2",
      R1: "a",
      R2: "b",
      R3: "c",
      R4: "∅",
      expectedResult: "ab*c",
    };
    const highlight = {
      stateToRemove: "q1",
      currentPath,
      highlightedR: "R2" as const,
    };

    // Act
    const { result } = renderHook(() => useGraphLayout(nfa, { highlight }));

    // Assert
    const edge = result.current.edges.find((e) => e.id === "t-loop")!;
    expect(edge.data?.isHighlighted).toBe(true);
    expect(edge.data?.isBeingRemoved).toBe(true);
  });

  it("highlights R3 edge (removed → successor) when highlightedR is R3", () => {
    // Arrange
    const nfa = makeNFA(
      ["q0", "q1", "q2"],
      [{ id: "t-r3", source: "q1", target: "q2", symbol: "c" }],
    );
    const currentPath = {
      from: "q0",
      to: "q2",
      R1: "a",
      R2: "∅",
      R3: "c",
      R4: "∅",
      expectedResult: "ac",
    };
    const highlight = {
      stateToRemove: "q1",
      currentPath,
      highlightedR: "R3" as const,
    };

    // Act
    const { result } = renderHook(() => useGraphLayout(nfa, { highlight }));

    // Assert
    const edge = result.current.edges.find((e) => e.id === "t-r3")!;
    expect(edge.data?.isHighlighted).toBe(true);
  });

  it("highlights R4 edge (predecessor → successor direct) when highlightedR is R4", () => {
    // Arrange
    const nfa = makeNFA(
      ["q0", "q1", "q2"],
      [{ id: "t-r4", source: "q0", target: "q2", symbol: "d" }],
    );
    const currentPath = {
      from: "q0",
      to: "q2",
      R1: "a",
      R2: "∅",
      R3: "b",
      R4: "d",
      expectedResult: "d+ab",
    };
    const highlight = {
      stateToRemove: "q1",
      currentPath,
      highlightedR: "R4" as const,
    };

    // Act
    const { result } = renderHook(() => useGraphLayout(nfa, { highlight }));

    // Assert
    const edge = result.current.edges.find((e) => e.id === "t-r4")!;
    expect(edge.data?.isHighlighted).toBe(true);
  });
});
