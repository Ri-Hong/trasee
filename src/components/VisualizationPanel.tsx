import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code2, Globe, Eye } from "lucide-react";
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
import { GraphVisualizer } from "./visualizers/GraphVisualizer";
import { buildGlobalStateTracking } from "@/lib/globalStateTracker";
import { useMemo } from "react";
import { Button } from "./ui/button";

export function VisualizationPanel() {
  const steps = useExecutionStore((state) => state.steps);
  const currentStep = useExecutionStore((state) => state.currentStep);
  const visualizationMode = useExecutionStore(
    (state) => state.visualizationMode
  );
  const setVisualizationMode = useExecutionStore(
    (state) => state.setVisualizationMode
  );

  // Build global state tracking once for all steps
  const globalState = useMemo(() => {
    if (steps.length === 0) return null;
    return buildGlobalStateTracking(steps);
  }, [steps]);

  if (steps.length === 0) {
    return (
      <div className="h-full w-full p-4 bg-panel-bg">
        <Card className="h-full flex flex-col items-center justify-center bg-card/50 border-dashed">
          <Code2 className="w-16 h-16 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            Variables Visualization
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Run your Python code to see all variables visualized in real-time.
            Perfect for understanding LeetCode solutions and algorithm behavior.
          </p>
        </Card>
      </div>
    );
  }

  const step = steps[currentStep];
  const variables = step?.variables || [];
  const currentPointers = globalState?.stepPointers.get(currentStep) || [];

  // Filter out only non-visualizable types (functions, modules, etc.)
  const visualizableVars = variables.filter((v) => {
    // Skip internal types
    if (
      [
        "function",
        "type",
        "module",
        "method",
        "builtin_function_or_method",
      ].includes(v.type)
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="h-full w-full p-4 bg-panel-bg">
      <Card className="h-full bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              Variables
              <span className="ml-2 text-xs text-muted-foreground">
                (Step {currentStep + 1}/{steps.length})
              </span>
            </h3>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={visualizationMode === "scope" ? "default" : "outline"}
                onClick={() => setVisualizationMode("scope")}
                className="h-7 px-2 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Scope
              </Button>
              <Button
                size="sm"
                variant={visualizationMode === "global" ? "default" : "outline"}
                onClick={() => setVisualizationMode("global")}
                className="h-7 px-2 text-xs"
              >
                <Globe className="w-3 h-3 mr-1" />
                Global
              </Button>
            </div>
          </div>
        </div>
        <ScrollArea className="h-[calc(100%-3.5rem)]">
          <div className="p-4 space-y-4">
            {visualizableVars.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No variables to visualize at this step
              </div>
            ) : (
              <>
                {/* Primitives section - displayed in a flex wrap layout */}
                {visualizableVars.some((v) => {
                  const type = detectDataStructure(v);
                  return ["num", "string", "boolean"].includes(type);
                }) && (
                  <div className="flex flex-wrap gap-2">
                    {visualizableVars.map((variable, idx) => {
                      const structureType = detectDataStructure(variable);
                      if (
                        structureType === "num" ||
                        structureType === "string" ||
                        structureType === "boolean"
                      ) {
                        return (
                          <PrimitiveVisualizer
                            key={`${variable.scope_id}-${variable.var_name}-${idx}`}
                            value={variable.value}
                            type={structureType}
                            variableName={variable.var_name}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                {/* Complex data structures - displayed in full width */}
                {visualizationMode === "scope"
                  ? // SCOPE MODE: Show only what's in current scope (original behavior)
                    visualizableVars.map((variable, idx) => {
                      const structureType = detectDataStructure(variable);
                      const vizData = prepareVisualizationData(
                        variable,
                        structureType
                      );

                      // Skip primitives (already rendered above)
                      if (
                        ["num", "string", "boolean"].includes(structureType)
                      ) {
                        return null;
                      }

                      return (
                        <div
                          key={`${variable.scope_id}-${variable.var_name}-${idx}`}
                        >
                          {structureType === "linked_list" && (
                            <LinkedListVisualizer
                              data={vizData}
                              variableName={variable.var_name}
                              dataType={variable.type}
                            />
                          )}
                          {structureType === "tree" && (
                            <TreeVisualizer
                              data={vizData}
                              variableName={variable.var_name}
                              dataType={variable.type}
                            />
                          )}
                          {structureType === "list" && (
                            <ListVisualizer
                              data={vizData}
                              variableName={variable.var_name}
                              dataType={variable.type}
                            />
                          )}
                          {structureType === "dict" && (
                            <DictVisualizer
                              data={vizData}
                              variableName={variable.var_name}
                              dataType={variable.type}
                            />
                          )}
                          {structureType === "graph" && (
                            <GraphVisualizer
                              data={vizData}
                              variableName={variable.var_name}
                              dataType={variable.type}
                            />
                          )}
                          {structureType === "unknown" && (
                            <PrimitiveVisualizer
                              value={variable.value}
                              type={variable.type}
                              variableName={variable.var_name}
                            />
                          )}
                        </div>
                      );
                    })
                  : // GLOBAL MODE: Show complete structures with highlights
                    globalState &&
                    Array.from(globalState.structures.entries()).map(
                      ([structId, structure]) => {
                        // Only show structures that are visible at or before current step
                        if (structure.firstSeenStep > currentStep) return null;

                        // Find which variables point into this structure
                        const pointersToStructure = currentPointers.filter(
                          (p) => p.structureId === structId
                        );

                        // Build highlighted nodes and labels
                        const highlightedNodes = pointersToStructure
                          .filter((p) => p.nodeId !== null)
                          .map((p) => p.nodeId as string);

                        const nodeLabels = new Map<string, string[]>();
                        pointersToStructure.forEach((p) => {
                          if (p.nodeId) {
                            const existing = nodeLabels.get(p.nodeId) || [];
                            nodeLabels.set(p.nodeId, [...existing, p.varName]);
                          }
                        });

                        // Prepare visualization data from the global structure
                        if (structure.structureType === "linked_list") {
                          const nodes = Array.from(structure.nodes.entries())
                            .map(([nodeId, nodeValue]) => {
                              const val =
                                nodeValue.__attrs__?.val ??
                                nodeValue.__attrs__?.value ??
                                nodeValue.__attrs__?.data ??
                                "?";
                              return { id: nodeId, value: val };
                            })
                            .sort((a, b) => {
                              // Sort by node index (extract number from id like "n_0", "n_1")
                              const aIdx = parseInt(
                                a.id.split("_").pop() || "0"
                              );
                              const bIdx = parseInt(
                                b.id.split("_").pop() || "0"
                              );
                              return aIdx - bIdx;
                            });

                          return (
                            <div key={structId}>
                              <LinkedListVisualizer
                                data={{ nodes }}
                                variableName={structure.rootVarName}
                                dataType="linked list"
                                highlightedNodes={highlightedNodes}
                                nodeLabels={nodeLabels}
                              />
                            </div>
                          );
                        }

                        if (structure.structureType === "tree") {
                          // For trees, we need to reconstruct the tree structure
                          // This is more complex - for now, use the first pointer's value
                          const firstPointer = pointersToStructure[0];
                          if (firstPointer) {
                            const variable = variables.find(
                              (v) => v.var_name === firstPointer.varName
                            );
                            if (variable) {
                              const vizData = prepareVisualizationData(
                                variable,
                                "tree"
                              );
                              return (
                                <div key={structId}>
                                  <TreeVisualizer
                                    data={vizData}
                                    variableName={structure.rootVarName}
                                    dataType="tree"
                                    highlightedNodes={highlightedNodes}
                                    nodeLabels={nodeLabels}
                                  />
                                </div>
                              );
                            }
                          }
                        }

                        return null;
                      }
                    )}
              </>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
