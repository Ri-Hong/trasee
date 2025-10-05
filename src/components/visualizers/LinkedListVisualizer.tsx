import { ArrowRight } from "lucide-react";

interface LinkedListNode {
  id: string;
  value: any;
}

interface LinkedListVisualizerProps {
  data: {
    nodes: LinkedListNode[];
  };
  variableName: string;
  dataType: string;
  highlightedNodes?: string[]; // IDs of nodes to highlight
  nodeLabels?: Map<string, string[]>; // Map of node ID to variable names pointing to it
}

export function LinkedListVisualizer({
  data,
  variableName,
  dataType,
  highlightedNodes = [],
  nodeLabels,
}: LinkedListVisualizerProps) {
  // Display "linked list" instead of the raw class name
  const displayType = "linked list";

  const isNodeHighlighted = (nodeId: string) =>
    highlightedNodes.includes(nodeId);
  const getNodeLabels = (nodeId: string) => nodeLabels?.get(nodeId) || [];

  // Check if any node has labels
  const hasLabels =
    data.nodes?.some((node) => getNodeLabels(node.id).length > 0) || false;

  if (!data.nodes || data.nodes.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            {variableName}
          </div>
          <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded">
            {displayType}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">Empty linked list</div>
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
          {displayType}
        </span>
      </div>
      <div
        className={`flex items-center gap-2 overflow-x-auto px-2 ${
          hasLabels ? "pt-8 pb-6" : "pt-2 pb-2"
        }`}
      >
        {data.nodes.map((node, idx) => {
          const highlighted = isNodeHighlighted(node.id);
          const labels = getNodeLabels(node.id);

          return (
            <div key={node.id} className="flex items-center gap-2">
              <div className="relative p-2">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center transition-all ${
                    highlighted
                      ? "from-blue-500 to-purple-500 border-4 border-yellow-400 shadow-lg shadow-yellow-400/50 scale-110"
                      : "from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20"
                  }`}
                >
                  <div
                    className={`text-lg font-semibold ${
                      highlighted ? "text-white" : ""
                    }`}
                  >
                    {String(node.value)}
                  </div>
                </div>
                {labels.length > 0 && (
                  <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {labels.map((label) => (
                      <span
                        key={label}
                        className="px-2 py-0.5 text-xs font-mono bg-yellow-500/90 text-black rounded whitespace-nowrap"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {idx < data.nodes.length - 1 && (
                <ArrowRight
                  className={`w-5 h-5 flex-shrink-0 ${
                    highlighted ? "text-blue-400" : "text-blue-500"
                  }`}
                />
              )}
            </div>
          );
        })}
        <div className="text-muted-foreground">→ null</div>
      </div>
    </div>
  );
}
