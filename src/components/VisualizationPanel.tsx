import { Card } from "@/components/ui/card";
import { Code2 } from "lucide-react";

export function VisualizationPanel() {
  return (
    <div className="h-full w-full p-4 bg-panel-bg">
      <Card className="h-full flex flex-col items-center justify-center bg-card/50 border-dashed">
        <Code2 className="w-16 h-16 mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Data Structure Visualization</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Run your Python code to see variables and data structures visualized in real-time.
          Perfect for understanding LeetCode solutions and algorithm behavior.
        </p>
      </Card>
    </div>
  );
}
