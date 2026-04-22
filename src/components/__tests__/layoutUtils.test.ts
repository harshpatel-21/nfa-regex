import { describe, it, expect } from "vitest";
import { getLayoutedElements } from "../../utils/layoutUtils";
import type { Node, Edge } from "@xyflow/react";

function makeNode(id: string, isStart = false): Node {
  return {
    id,
    type: "stateNode",
    position: { x: 0, y: 0 },
    data: { label: id, isStart, isFinal: false },
  };
}

function makeEdge(id: string, source: string, target: string): Edge {
  return { id, source, target, data: {} };
}

describe("getLayoutedElements", () => {
  it("returns empty arrays when given no nodes", () => {
    const { nodes, edges } = getLayoutedElements([], []);
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });

  it("assigns non-zero positions to nodes after layout", () => {
    const nodes = [makeNode("q0", true), makeNode("q1")];
    const edges = [makeEdge("e0", "q0", "q1")];
    const { nodes: laid } = getLayoutedElements(nodes, edges);
    expect(laid).toHaveLength(2);
    // Dagre should place them at different x positions
    const [n0, n1] = laid;
    expect(n0!.position).toBeDefined();
    expect(n1!.position).toBeDefined();
    expect(n0!.position.x).not.toBe(n1!.position.x);
  });

  it("returns the same edges (positions not modified by layout)", () => {
    const nodes = [makeNode("q0", true), makeNode("q1")];
    const edges = [makeEdge("e0", "q0", "q1")];
    const { edges: laid } = getLayoutedElements(nodes, edges);
    expect(laid).toHaveLength(1);
    expect(laid[0]!.id).toBe("e0");
  });

  it("handles a single node with no edges (no start marker needed)", () => {
    const { nodes: laid } = getLayoutedElements([makeNode("q0")], []);
    expect(laid).toHaveLength(1);
    expect(laid[0]!.position).toBeDefined();
  });

  it("skips self-loops when building the BFS spanning tree", () => {
    const nodes = [makeNode("q0", true), makeNode("q1")];
    const edges = [
      makeEdge("self", "q0", "q0"), // self-loop — excluded from dagre
      makeEdge("e1", "q0", "q1"),
    ];
    const { nodes: laid } = getLayoutedElements(nodes, edges);
    // Layout should succeed without throwing even with a self-loop
    expect(laid).toHaveLength(2);
  });

  it("handles TB (top-to-bottom) direction without throwing", () => {
    const nodes = [makeNode("q0", true), makeNode("q1")];
    const edges = [makeEdge("e0", "q0", "q1")];
    expect(() => getLayoutedElements(nodes, edges, "TB")).not.toThrow();
  });

  it("handles a graph with no start-marked node by falling back to first node", () => {
    const nodes = [makeNode("q0", false), makeNode("q1", false)];
    const edges = [makeEdge("e0", "q0", "q1")];
    const { nodes: laid } = getLayoutedElements(nodes, edges);
    expect(laid).toHaveLength(2);
  });

  it("handles nodes that are unreachable from the start node (separate component)", () => {
    const nodes = [makeNode("q0", true), makeNode("q1"), makeNode("isolated")];
    const edges = [makeEdge("e0", "q0", "q1")];
    const { nodes: laid } = getLayoutedElements(nodes, edges);
    expect(laid).toHaveLength(3);
    const isolatedNode = laid.find((n) => n.id === "isolated");
    expect(isolatedNode!.position).toBeDefined();
  });
});
