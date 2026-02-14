import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppContext } from '../../state/AppContext';
import { useGraphLayout } from '../../hooks/useGraphLayout';
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';
import { GraphToolbar } from './GraphToolbar';

const nodeTypes: NodeTypes = {
  stateNode: StateNode,
};

const edgeTypes: EdgeTypes = {
  transitionEdge: TransitionEdge,
};

export function GraphCanvas() {
  const { state } = useAppContext();
  const { getLayout } = useGraphLayout();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layoutKey, setLayoutKey] = useState(0);

  // Determine which data source to use based on mode
  const dataSource = useMemo(() => {
    if (state.mode === 'conversion' && state.conversion.gtg) {
      return state.conversion.gtg;
    }
    return state.nfa;
  }, [state.mode, state.nfa, state.conversion.gtg]);

  // Apply layout whenever data source changes
  useEffect(() => {
    if (dataSource.states.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const layout = getLayout(dataSource);

    // Mark states based on conversion state
    const updatedNodes = layout.nodes.map(node => {
      const nodeData = { ...node.data } as Record<string, unknown>;
      if (state.mode === 'conversion' && state.conversion.selectedStateId) {
        nodeData.isEliminating = node.id === state.conversion.selectedStateId;
      }
      return { ...node, data: nodeData };
    });

    setNodes(updatedNodes);
    setEdges(layout.edges);
    setLayoutKey(k => k + 1);
  }, [dataSource, state.mode, state.conversion.selectedStateId, getLayout, setNodes, setEdges]);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setNodes(nds =>
        nds.map(n => (n.id === node.id ? { ...n, position: node.position } : n))
      );
    },
    [setNodes]
  );

  return (
    <div className="relative w-full h-full bg-gray-50">
      <GraphToolbar />
      <ReactFlow
        key={layoutKey}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={() => '#e2e8f0'}
          className="bg-white border border-gray-200 rounded"
        />
      </ReactFlow>
    </div>
  );
}
