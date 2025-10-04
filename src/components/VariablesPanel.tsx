import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useExecutionStore } from "@/store/executionStore";
import { detectDataStructure } from "@/lib/dataStructureDetector";
import { Badge } from "@/components/ui/badge";

export function VariablesPanel() {
  const steps = useExecutionStore((state) => state.steps);
  const currentStep = useExecutionStore((state) => state.currentStep);

  const step = steps[currentStep];
  const variables = step?.variables || [];

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "None";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "object") {
      if (value.__class__) return `<${value.__class__}>`;
      if (Array.isArray(value)) return `[${value.length} items]`;
      return "{...}";
    }
    return String(value);
  };

  const getTypeColor = (structureType: string) => {
    switch (structureType) {
      case "linked_list":
        return "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30";
      case "tree":
        return "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30";
      case "list":
        return "bg-green-500/20 text-green-500 hover:bg-green-500/30";
      case "dict":
        return "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30";
      case "num":
        return "bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30";
      case "string":
        return "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30";
      case "boolean":
        return "bg-pink-500/20 text-pink-500 hover:bg-pink-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30";
    }
  };

  return (
    <Card className="h-full bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Variables</h3>
      </div>
      <ScrollArea className="h-[calc(100%-3.5rem)]">
        <div className="p-4 space-y-2">
          {variables.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No variables to display yet
            </div>
          ) : (
            variables.map((variable, idx) => {
              const structureType = detectDataStructure(variable);
              return (
                <div
                  key={`${variable.scope_id}-${variable.var_name}-${idx}`}
                  className="p-3 rounded-lg bg-background/50 border border-border hover:border-border/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-semibold">
                      {variable.var_name}
                    </span>
                    <Badge className={`text-xs ${getTypeColor(structureType)}`}>
                      {structureType}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {formatValue(variable.value)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
