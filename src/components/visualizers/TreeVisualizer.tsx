import { Card } from "@/components/ui/card";
import { useMemo } from "react";

interface TreeNode {
  id: string;
  value: any;
  children: TreeNode[];
  isBinaryTree?: boolean;
  left?: TreeNode | null;
  right?: TreeNode | null;
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

interface PositionedNode {
  id: string;
  value: any;
  x: number;
  y: number;
  isHighlighted: boolean;
  labels: string[];
}

interface TreeEdge {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

function buildTreeLayout(
  root: TreeNode | null,
  highlightedNodes: string[] = [],
  nodeLabels?: Map<string, string[]>
): {
  nodes: PositionedNode[];
  edges: TreeEdge[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
} {
  if (!root)
    return {
      nodes: [],
      edges: [],
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    };

  const nodes: PositionedNode[] = [];
  const edges: TreeEdge[] = [];
  let minX = 0,
    maxX = 0,
    minY = 0,
    maxY = 0;

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

    // Track bounds
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    // Add current node
    nodes.push({
      id: node.id,
      value: node.value,
      x,
      y,
      isHighlighted,
      labels,
    });

    // Position children with spacing that decreases with depth
    if (node.children.length > 0) {
      const childSpacing = horizontalSpacing / Math.pow(2, depth);

      // Special handling for binary trees
      if (node.isBinaryTree) {
        // Left child
        if (node.left) {
          const leftX = x - childSpacing / 2;
          const childY = y + 100;
          edges.push({
            fromX: x,
            fromY: y,
            toX: leftX,
            toY: childY,
          });
          layoutTree(node.left, leftX, childY, horizontalSpacing, depth + 1);
        }

        // Right child
        if (node.right) {
          const rightX = x + childSpacing / 2;
          const childY = y + 100;
          edges.push({
            fromX: x,
            fromY: y,
            toX: rightX,
            toY: childY,
          });
          layoutTree(node.right, rightX, childY, horizontalSpacing, depth + 1);
        }
      } else {
        // N-ary tree: distribute children symmetrically
        node.children.forEach((child, index) => {
          const offset =
            (index - (node.children.length - 1) / 2) * childSpacing;
          const childX = x + offset;
          const childY = y + 100;

          edges.push({
            fromX: x,
            fromY: y,
            toX: childX,
            toY: childY,
          });

          layoutTree(child, childX, childY, horizontalSpacing, depth + 1);
        });
      }
    }
  }

  // Start layout from root
  const treeDepth = getTreeDepth(root);
  const horizontalSpacing = 80 * Math.pow(2, Math.min(treeDepth, 5));
  layoutTree(root, 0, 0, horizontalSpacing, 0);

  return { nodes, edges, bounds: { minX, maxX, minY, maxY } };
}

export function TreeVisualizer({
  data,
  variableName,
  dataType,
  highlightedNodes = [],
  nodeLabels,
}: TreeVisualizerProps) {
  const layout = useMemo(() => {
    return buildTreeLayout(data.root, highlightedNodes, nodeLabels);
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

  const { nodes, edges, bounds } = layout;
  const nodeRadius = 25;
  const padding = 50;

  // Calculate SVG viewport
  const viewBoxWidth = bounds.maxX - bounds.minX + 2 * padding;
  const viewBoxHeight = bounds.maxY - bounds.minY + 2 * padding;
  const offsetX = -bounds.minX + padding;
  const offsetY = -bounds.minY + padding;

  // Helper function to calculate edge endpoints that stop at circle edge
  const calculateEdgePoints = (edge: TreeEdge) => {
    const x1 = edge.fromX + offsetX;
    const y1 = edge.fromY + offsetY;
    const x2 = edge.toX + offsetX;
    const y2 = edge.toY + offsetY;

    // Calculate direction vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return { x1, y1, x2, y2 };

    // Normalize direction
    const nx = dx / length;
    const ny = dy / length;

    // Shorten the line by the radius on both ends
    return {
      x1: x1 + nx * nodeRadius,
      y1: y1 + ny * nodeRadius,
      x2: x2 - nx * nodeRadius,
      y2: y2 - ny * nodeRadius,
    };
  };

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
      <Card className="w-full bg-background/50">
        <svg
          className="w-full h-[300px]"
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Render edges */}
          {edges.map((edge, idx) => {
            const points = calculateEdgePoints(edge);
            return (
              <line
                key={`edge-${idx}`}
                x1={points.x1}
                y1={points.y1}
                x2={points.x2}
                y2={points.y2}
                stroke="rgba(59, 130, 246, 0.5)"
                strokeWidth="2"
              />
            );
          })}

          {/* Render nodes */}
          {nodes.map((node) => {
            const cx = node.x + offsetX;
            const cy = node.y + offsetY;

            return (
              <g key={node.id}>
                {/* Highlight glow */}
                {node.isHighlighted && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={nodeRadius + 4}
                    fill="none"
                    stroke="rgba(250, 204, 21, 0.5)"
                    strokeWidth="4"
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={nodeRadius}
                  fill={
                    node.isHighlighted
                      ? "url(#highlightGradient)"
                      : "url(#normalGradient)"
                  }
                  stroke={
                    node.isHighlighted
                      ? "rgba(250, 204, 21, 1)"
                      : "rgba(59, 130, 246, 0.4)"
                  }
                  strokeWidth={node.isHighlighted ? "3" : "2"}
                />

                {/* Node label (variable names) */}
                {node.labels.length > 0 && (
                  <text
                    x={cx}
                    y={cy - nodeRadius - 8}
                    fill="rgba(250, 204, 21, 1)"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {node.labels.join(", ")}
                  </text>
                )}

                {/* Node value */}
                <text
                  x={cx}
                  y={cy}
                  fill="#ffffff"
                  fontSize="14"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)" }}
                >
                  {String(node.value)}
                </text>
              </g>
            );
          })}

          {/* Gradients */}
          <defs>
            <linearGradient
              id="highlightGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(59, 130, 246, 1)" />
              <stop offset="100%" stopColor="rgba(168, 85, 247, 1)" />
            </linearGradient>
            <linearGradient
              id="normalGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
              <stop offset="100%" stopColor="rgba(168, 85, 247, 0.15)" />
            </linearGradient>
          </defs>
        </svg>
      </Card>
    </div>
  );
}
