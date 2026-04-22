import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { NFA, GTG, StateId, PathUpdate } from "../core/types";
import { getLayoutedElements } from "../utils/layoutUtils";

interface HighlightInfo {
  stateToRemove: StateId | null;
  currentPath: PathUpdate | null;
  highlightedR: "R1" | "R2" | "R3" | "R4" | null;
}

interface ThompsonHighlightInfo {
  newStateIds: string[];
  newTransitionIds: string[];
}

interface GraphLayoutOptions {
  direction?: "TB" | "LR";
  highlight?: HighlightInfo;
  thompsonHighlight?: ThompsonHighlightInfo;
}

const R_COLORS: Record<string, string> = {
  R1: "#3b82f6",
  R2: "#f97316",
  R3: "#22c55e",
  R4: "#a855f7",
};

const THOMPSON_NEW_COLOR = "#f59e0b"; // amber-500

/**
 * Convert an NFA or GTG into positioned React Flow nodes and edges.
 * Applies R-value highlight colouring during state elimination and amber highlights for newly added Thompson states/transitions.
 *
 * Note: A significant portion of the graph layout logic and algorithms in this file
 * was generated with the assistance of Google Gemini.
 */
export function useGraphLayout(
  nfaOrGtg: NFA | GTG | null,
  options: GraphLayoutOptions = {},
) {
  const { direction = "LR", highlight, thompsonHighlight } = options;

  return useMemo(() => {
    if (!nfaOrGtg) {
      return { nodes: [] as Node[], edges: [] as Edge[] };
    }

    const newStateSet = new Set(thompsonHighlight?.newStateIds ?? []);
    const newTransSet = new Set(thompsonHighlight?.newTransitionIds ?? []);

    const nodes: Node[] = nfaOrGtg.states.map((state) => {
      const isBeingEliminated = highlight?.stateToRemove === state.id;
      const isPredecessor = highlight?.currentPath?.from === state.id;
      const isSuccessor = highlight?.currentPath?.to === state.id;
      const isNewlyAdded = newStateSet.has(state.id);

      return {
        id: state.id,
        type: "stateNode",
        position: { x: 0, y: 0 },
        data: {
          label: state.label,
          isStart: state.isStart,
          isFinal: state.isFinal,
          isBeingEliminated,
          isPredecessor,
          isSuccessor,
          isNewlyAdded,
        },
      };
    });

    const edges: Edge[] = nfaOrGtg.transitions.map((transition) => {
      let isHighlighted = false;
      let highlightColor: string | undefined;
      let isBeingRemoved = false;

      // NFA→Regex elimination highlight
      if (highlight?.currentPath && highlight.stateToRemove) {
        const path = highlight.currentPath;
        const removedId = highlight.stateToRemove;

        if (
          transition.source === path.from &&
          transition.target === removedId
        ) {
          if (highlight.highlightedR === "R1") {
            isHighlighted = true;
            highlightColor = R_COLORS["R1"];
          }
          isBeingRemoved = true;
        }
        if (
          transition.source === removedId &&
          transition.target === removedId
        ) {
          if (highlight.highlightedR === "R2") {
            isHighlighted = true;
            highlightColor = R_COLORS["R2"];
          }
          isBeingRemoved = true;
        }
        if (transition.source === removedId && transition.target === path.to) {
          if (highlight.highlightedR === "R3") {
            isHighlighted = true;
            highlightColor = R_COLORS["R3"];
          }
          isBeingRemoved = true;
        }
        if (transition.source === path.from && transition.target === path.to) {
          if (highlight.highlightedR === "R4") {
            isHighlighted = true;
            highlightColor = R_COLORS["R4"];
          }
        }
      }

      // Thompson highlight: newly added transitions
      if (newTransSet.has(transition.id)) {
        isHighlighted = true;
        highlightColor = THOMPSON_NEW_COLOR;
      }

      return {
        id: transition.id,
        source: transition.source,
        target: transition.target,
        type: "transitionEdge",
        data: {
          symbol: transition.symbol,
          isSelfLoop: transition.source === transition.target,
          isHighlighted,
          highlightColor,
          isBeingRemoved,
        },
      };
    });

    return getLayoutedElements(nodes, edges, direction);
  }, [nfaOrGtg, direction, highlight, thompsonHighlight]);
}
