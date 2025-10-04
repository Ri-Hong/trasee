import { Card } from "@/components/ui/card";

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
        return "from-blue-500/10 to-cyan-500/10 border-blue-500/20";
      case "string":
        return "from-yellow-500/10 to-amber-500/10 border-yellow-500/20";
      case "boolean":
        return "from-purple-500/10 to-pink-500/10 border-purple-500/20";
      default:
        return "from-gray-500/10 to-slate-500/10 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">
        {variableName}
      </div>
      <Card className={`p-3 bg-gradient-to-br ${getColor()}`}>
        <div className="text-sm">
          <span className="text-muted-foreground">{type}: </span>
          <span className="font-semibold">
            {type === "string" ? `"${value}"` : String(value)}
          </span>
        </div>
      </Card>
    </div>
  );
}
