import { Badge } from "@/components/ui/badge";

interface PrimitiveVisualizerProps {
  value: any;
  type: string;
  variableName: string;
}

export function PrimitiveVisualizer({
  value,
  type,
  variableName,
}: PrimitiveVisualizerProps) {
  const getColor = () => {
    switch (type) {
      case "num":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case "string":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
      case "boolean":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30";
    }
  };

  const formatValue = () => {
    if (type === "string") return `"${value}"`;
    return String(value);
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors">
      <span className="text-sm font-mono font-medium">{variableName}</span>
      <span className="text-muted-foreground">=</span>
      <Badge variant="outline" className={`${getColor()} font-mono text-xs`}>
        {formatValue()}
      </Badge>
    </div>
  );
}
