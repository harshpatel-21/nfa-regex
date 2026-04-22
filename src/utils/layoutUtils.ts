import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

const NODE_WIDTH = 80;
const NODE_HEIGHT = 80;

/**
 * Run dagre layout on nodes and edges, using a BFS spanning tree from the start node
 * to avoid the cycle-breaking artifacts that occur when all edges are fed to dagre.
 * Returns nodes with computed x/y positions.
 * 
 * Note: This file was made with the assistance of Google Gemini.
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "LR",
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 120,
    marginx: 40,
    marginy: 40,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  // Use a BFS spanning tree from the start node rather than all edges.
  // Feeding every edge to dagre causes cycle-breaking that collapses
  // bidirectional graphs into a single linear rank. With BFS, nodes
  // reachable in one hop from the start share a rank and spread vertically.
  const startNodeId =
    nodes.find((n) => n.data?.["isStart"] === true)?.id ?? nodes[0]?.id;

  if (startNodeId) {
    const visited = new Set([startNodeId]);
    const queue = [startNodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of edges) {
        if (
          edge.source === current &&
          edge.source !== edge.target &&
          !visited.has(edge.target)
        ) {
          visited.add(edge.target);
          queue.push(edge.target);
          g.setEdge(edge.source, edge.target);
        }
      }
    }
  } else {
    for (const edge of edges) {
      if (edge.source !== edge.target) {
        g.setEdge(edge.source, edge.target);
      }
    }
  }

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: (pos?.x ?? 0) - NODE_WIDTH / 2,
        y: (pos?.y ?? 0) - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
