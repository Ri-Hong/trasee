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
  dataType: string;
  highlightedNodes?: string[]; // IDs of nodes to highlight
  nodeLabels?: Map<string, string[]>; // Map of node ID to variable names pointing to it
}

function buildFlowGraph(
  root: TreeNode | null,
  highlightedNodes: string[] = [],
  nodeLabels?: Map<string, string[]>
): {
  nodes: Node[];
  edges: Edge[];
} {
  if (!root) return { nodes: [], edges: [] };

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Calculate the depth of the tree
  function getTreeDepth(node: TreeNode | null): number {
    if (!node || node.children.length === 0) return 0;
    return 1 + Math.max(...node.children.map(getTreeDepth));
  }

  // Recursive layout function that positions nodes properly
  function layoutTree(
    node: TreeNode,
    x: number,
    y: number,
    horizontalSpacing: number,
    depth: number
  ) {
    const isHighlighted = highlightedNodes.includes(node.id);
    const labels = nodeLabels?.get(node.id) || [];

    // Build label display
    let labelContent = String(node.value);
    if (labels.length > 0) {
      labelContent = `${labels.join(", ")}\n${node.value}`;
    }

    // Add current node
    nodes.push({
      id: node.id,
      position: { x, y },
      data: { label: labelContent },
      type: "default",
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      style: {
        background: isHighlighted
          ? "linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(168, 85, 247, 1))"
          : "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(168, 85, 247, 0.15))",
        border: isHighlighted
          ? "4px solid rgba(250, 204, 21, 1)"
          : "2px solid rgba(59, 130, 246, 0.4)",
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
        boxShadow: isHighlighted
          ? "0 0 20px rgba(250, 204, 21, 0.5)"
          : undefined,
        transform: isHighlighted ? "scale(1.1)" : undefined,
      },
    });

    // Position children with spacing that decreases with depth
    if (node.children.length > 0) {
      const childSpacing = horizontalSpacing / Math.pow(2, depth);

      node.children.forEach((child, index) => {
        // Calculate child position relative to parent
        const offset = (index - (node.children.length - 1) / 2) * childSpacing;
        const childX = x + offset;

        // Add edge from parent to child
        edges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          style: { stroke: "rgba(59, 130, 246, 0.5)", strokeWidth: 2 },
        });

        // Recursively layout child subtree
        layoutTree(child, childX, y + 100, horizontalSpacing, depth + 1);
      });
    }
  }

  // Start layout from root
  const treeDepth = getTreeDepth(root);
  const horizontalSpacing = 80 * Math.pow(2, Math.min(treeDepth, 5));
  layoutTree(root, 0, 0, horizontalSpacing, 0);

  return { nodes, edges };
}

export function TreeVisualizer({
  data,
  variableName,
  dataType,
  highlightedNodes = [],
  nodeLabels,
}: TreeVisualizerProps) {
  const [flowData, setFlowData] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  useEffect(() => {
    if (data.root) {
      const graph = buildFlowGraph(data.root, highlightedNodes, nodeLabels);
      setFlowData(graph);
    }
  }, [data, highlightedNodes, nodeLabels]);

  if (!data.root) {
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
        <div className="text-sm text-muted-foreground">Empty tree</div>
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
      <Card className="h-[300px] w-full bg-background/50">
        <ReactFlow
          nodes={flowData.nodes}
          edges={flowData.edges}
          fitView
          proOptions={{ hideAttribution: true }}
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
