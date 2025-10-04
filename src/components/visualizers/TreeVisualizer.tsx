import { Card } from "@/components/ui/card";
import ReactFlow, { Node, Edge, Position } from "reactflow";
import "reactflow/dist/style.css";
import { useEffect, useState } from "react";

interface TreeNode {
  id: string;
  value: any;
  children: TreeNode[];
}

interface TreeVisualizerProps {
  data: {
    root: TreeNode | null;
  };
  variableName: string;
}

function buildFlowGraph(root: TreeNode | null): {
  nodes: Node[];
  edges: Edge[];
} {
  if (!root) return { nodes: [], edges: [] };

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Calculate positions using a simple level-based layout
  const levels: TreeNode[][] = [];

  function traverse(node: TreeNode, level: number) {
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);

    node.children.forEach((child) => {
      traverse(child, level + 1);
    });
  }

  traverse(root, 0);

  // Calculate positions
  const levelHeight = 100;
  levels.forEach((levelNodes, levelIdx) => {
    const levelWidth = levelNodes.length * 100;
    levelNodes.forEach((node, nodeIdx) => {
      const x = (nodeIdx - (levelNodes.length - 1) / 2) * 120;
      const y = levelIdx * levelHeight;

      nodes.push({
        id: node.id,
        position: { x, y },
        data: { label: String(node.value) },
        type: "default",
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: {
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))",
          border: "2px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "50%",
          width: 50,
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: "bold",
        },
      });
    });
  });

  // Build edges
  function buildEdges(node: TreeNode) {
    node.children.forEach((child) => {
      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        style: { stroke: "rgba(59, 130, 246, 0.5)", strokeWidth: 2 },
      });
      buildEdges(child);
    });
  }

  buildEdges(root);

  return { nodes, edges };
}

export function TreeVisualizer({ data, variableName }: TreeVisualizerProps) {
  const [flowData, setFlowData] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  useEffect(() => {
    if (data.root) {
      const graph = buildFlowGraph(data.root);
      setFlowData(graph);
    }
  }, [data]);

  if (!data.root) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">
          {variableName}
        </div>
        <div className="text-sm text-muted-foreground">Empty tree</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">
        {variableName}
      </div>
      <Card className="h-[300px] w-full bg-background/50">
        <ReactFlow
          nodes={flowData.nodes}
          edges={flowData.edges}
          fitView
          attributionPosition="bottom-left"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          preventScrolling={false}
        />
      </Card>
    </div>
  );
}
