import { Card } from "@/components/ui/card";
import ReactFlow, { Node, Edge, Position } from "reactflow";
import "reactflow/dist/style.css";
import { useEffect, useState } from "react";

interface GraphNode {
  id: string;
  label: string;
}

interface GraphEdge {
  from: string;
  to: string;
}

interface GraphVisualizerProps {
  data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  variableName: string;
  dataType: string;
}

function buildFlowGraph(
  graphNodes: GraphNode[],
  graphEdges: GraphEdge[]
): {
  nodes: Node[];
  edges: Edge[];
} {
  if (!graphNodes || graphNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Simple circular layout
  const centerX = 0;
  const centerY = 0;
  const radius = Math.max(100, graphNodes.length * 30);

  graphNodes.forEach((node, idx) => {
    const angle = (idx * 2 * Math.PI) / graphNodes.length;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    nodes.push({
      id: node.id,
      position: { x, y },
      data: { label: node.label },
      type: "default",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background:
          "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(168, 85, 247, 0.15))",
        border: "2px solid rgba(59, 130, 246, 0.4)",
        borderRadius: "50%",
        width: 50,
        height: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontWeight: "bold",
        color: "#ffffff",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
      },
    });
  });

  // Build edges
  graphEdges.forEach((edge, idx) => {
    edges.push({
      id: `edge-${idx}-${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      style: { stroke: "rgba(59, 130, 246, 0.5)", strokeWidth: 2 },
      animated: true,
    });
  });

  return { nodes, edges };
}

export function GraphVisualizer({
  data,
  variableName,
  dataType,
}: GraphVisualizerProps) {
  const [flowData, setFlowData] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  useEffect(() => {
    if (data.nodes && data.nodes.length > 0) {
      const graph = buildFlowGraph(data.nodes, data.edges || []);
      setFlowData(graph);
    }
  }, [data]);

  if (!data.nodes || data.nodes.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            {variableName}
          </div>
          <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded">
            {dataType}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">Empty graph</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-muted-foreground">
          {variableName}
        </div>
        <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded">
          {dataType}
        </span>
      </div>
      <Card className="h-[400px] w-full bg-background/50">
        <ReactFlow
          nodes={flowData.nodes}
          edges={flowData.edges}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          preventScrolling={false}
        />
      </Card>
    </div>
  );
}
