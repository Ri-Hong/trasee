import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code2 } from "lucide-react";
import { useExecutionStore } from "@/store/executionStore";
import {
  detectDataStructure,
  prepareVisualizationData,
} from "@/lib/dataStructureDetector";
import { LinkedListVisualizer } from "./visualizers/LinkedListVisualizer";
import { TreeVisualizer } from "./visualizers/TreeVisualizer";
import { ListVisualizer } from "./visualizers/ListVisualizer";
import { DictVisualizer } from "./visualizers/DictVisualizer";
import { PrimitiveVisualizer } from "./visualizers/PrimitiveVisualizer";

export function VisualizationPanel() {
  const steps = useExecutionStore((state) => state.steps);
  const currentStep = useExecutionStore((state) => state.currentStep);

  if (steps.length === 0) {
    return (
      <div className="h-full w-full p-4 bg-panel-bg">
        <Card className="h-full flex flex-col items-center justify-center bg-card/50 border-dashed">
          <Code2 className="w-16 h-16 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            Data Structure Visualization
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Run your Python code to see variables and data structures visualized
            in real-time. Perfect for understanding LeetCode solutions and
            algorithm behavior.
          </p>
        </Card>
      </div>
    );
  }

  const step = steps[currentStep];
  const variables = step?.variables || [];

  // Filter variables to show only interesting data structures
  const visualizableVars = variables.filter((v) => {
    const structureType = detectDataStructure(v);
    return ["linked_list", "tree", "list", "dict", "graph"].includes(
      structureType
    );
  });

  return (
    <div className="h-full w-full p-4 bg-panel-bg">
      <Card className="h-full bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">
            Data Structure Visualization
            <span className="ml-2 text-xs text-muted-foreground">
              (Step {currentStep + 1}/{steps.length})
            </span>
          </h3>
        </div>
        <ScrollArea className="h-[calc(100%-3.5rem)]">
          <div className="p-4 space-y-6">
            {visualizableVars.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No complex data structures detected at this step
              </div>
            ) : (
              visualizableVars.map((variable, idx) => {
                const structureType = detectDataStructure(variable);
                const vizData = prepareVisualizationData(
                  variable,
                  structureType
                );

                return (
                  <div key={`${variable.scope_id}-${variable.var_name}-${idx}`}>
                    {structureType === "linked_list" && (
                      <LinkedListVisualizer
                        data={vizData}
                        variableName={variable.var_name}
                      />
                    )}
                    {structureType === "tree" && (
                      <TreeVisualizer
                        data={vizData}
                        variableName={variable.var_name}
                      />
                    )}
                    {structureType === "list" && (
                      <ListVisualizer
                        data={vizData}
                        variableName={variable.var_name}
                      />
                    )}
                    {structureType === "dict" && (
                      <DictVisualizer
                        data={vizData}
                        variableName={variable.var_name}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
