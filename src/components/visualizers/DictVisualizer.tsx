import { Card } from "@/components/ui/card";

interface DictVisualizerProps {
  data: {
    entries: Array<{ key: string; value: any }>;
  };
  variableName: string;
  dataType: string;
}

export function DictVisualizer({
  data,
  variableName,
  dataType,
}: DictVisualizerProps) {
  if (!data || !data.entries || data.entries.length === 0) {
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
        <div className="text-sm text-muted-foreground">Empty dictionary</div>
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
      <Card className="p-3 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <div className="space-y-2 text-sm font-mono">
          {data.entries.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-orange-500 font-semibold">
                "{entry.key}"
              </span>
              <span className="text-muted-foreground">:</span>
              <span className="text-foreground">
                {JSON.stringify(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
