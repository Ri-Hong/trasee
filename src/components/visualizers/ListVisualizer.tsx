import { Card } from "@/components/ui/card";

interface ListVisualizerProps {
  data: {
    items: Array<{ index: number; value: any }>;
  };
  variableName: string;
}

export function ListVisualizer({ data, variableName }: ListVisualizerProps) {
  if (!data.items || data.items.length === 0) {
    return <div className="text-sm text-muted-foreground">Empty list</div>;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">
        {variableName}
      </div>
      <div className="grid grid-cols-8 gap-2">
        {data.items.map((item) => (
          <Card
            key={item.index}
            className="p-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20"
          >
            <div className="text-xs text-muted-foreground text-center mb-1">
              [{item.index}]
            </div>
            <div className="text-sm font-semibold text-center">
              {String(item.value)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
