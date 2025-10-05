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
}

export function LinkedListVisualizer({
  data,
  variableName,
  dataType,
}: LinkedListVisualizerProps) {
  // Display "linked list" instead of the raw class name
  const displayType = "linked list";

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
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        {data.nodes.map((node, idx) => (
          <div key={node.id} className="flex items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20 flex items-center justify-center">
              <div className="text-lg font-semibold">{String(node.value)}</div>
            </div>
            {idx < data.nodes.length - 1 && (
              <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0" />
            )}
          </div>
        ))}
        <div className="text-muted-foreground">→ null</div>
      </div>
    </div>
  );
}
