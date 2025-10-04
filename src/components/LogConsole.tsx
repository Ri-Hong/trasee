import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useExecutionStore } from "@/store/executionStore";
import {
  Terminal,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogConsole() {
  const logs = useExecutionStore((state) => state.logs);
  const clearLogs = useExecutionStore((state) => state.clearLogs);

  const getIcon = (level: string) => {
    switch (level) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getColor = (level: string) => {
    switch (level) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      default:
        return "text-blue-500";
    }
  };

  return (
    <Card className="h-full bg-card border-border">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Execution Log</h3>
        </div>
        {logs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            className="h-7 text-xs"
          >
            Clear
          </Button>
        )}
      </div>
      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="p-3 space-y-2 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-muted-foreground text-center py-4">
              No logs yet. Click "Run" to execute code.
            </div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded bg-background/50"
              >
                <div className="mt-0.5">{getIcon(log.level)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold ${getColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-foreground whitespace-pre-wrap break-words">
                    {log.message}
                  </div>
                  {log.data && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View data
                      </summary>
                      <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
