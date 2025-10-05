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

                        // Skip structures for traversal pointers (they should appear as labels on other structures)
                        const isTraversalPointer = ["curr", "current"].includes(
                          structure.rootVarName.toLowerCase()
                        );
                        if (isTraversalPointer) return null;

                        // Check if this is a builder variable (needed for traversal pointer logic)
                        const isBuilderVar = [
                          "dummy",
                          "head",
                          "result",
                          "ans",
                          "output",
                        ].includes(structure.rootVarName.toLowerCase());

                        // Find which variables point into this structure
                        let pointersToStructure = currentPointers.filter(
                          (p) => p.structureId === structId
                        );

                        // Also check ALL variables to see if they point into this structure
                        // This catches traversal pointers like curr that might not be tracked correctly
                        if (isBuilderVar) {
                          variables.forEach((variable) => {
                            // Skip if already tracked
                            const alreadyTracked = pointersToStructure.some(
                              (p) => p.varName === variable.var_name
                            );
                            if (alreadyTracked) return;

                            // Skip if not a linked list node
                            if (
                              !variable.value ||
                              typeof variable.value !== "object" ||
                              !variable.value.__attrs__ ||
                              variable.value.__attrs__.next === undefined
                            ) {
                              return;
                            }

                            // Get the current structure's node list
                            let currentStructureVar = variables.find(
                              (v) => v.var_name === structure.rootVarName
                            );

                            if (!currentStructureVar) {
                              for (let i = currentStep - 1; i >= 0; i--) {
                                const prevStepVars = steps[i]?.variables || [];
                                currentStructureVar = prevStepVars.find(
                                  (v) => v.var_name === structure.rootVarName
                                );
                                if (currentStructureVar) break;
                              }
                            }

                            if (
                              currentStructureVar &&
                              currentStructureVar.value
                            ) {
                              // Walk through the structure to find matching node
                              let structNode = currentStructureVar.value;
                              let nodeIndex = 0;

                              while (
                                structNode &&
                                typeof structNode === "object" &&
                                structNode.__attrs__
                              ) {
                                const structVal =
                                  structNode.__attrs__.val ??
                                  structNode.__attrs__.value ??
                                  structNode.__attrs__.data;
                                const varVal =
                                  variable.value.__attrs__?.val ??
                                  variable.value.__attrs__?.value ??
                                  variable.value.__attrs__?.data;

                                if (structVal === varVal) {
                                  // Found matching node!
                                  const nodeId = `${structure.rootVarName.charAt(
                                    0
                                  )}_${nodeIndex}`;
                                  pointersToStructure.push({
                                    varName: variable.var_name,
                                    structureId: structId,
                                    nodeId: nodeId,
                                  });
                                  break;
                                }

                                structNode = structNode.__attrs__.next;
                                nodeIndex++;
                                if (nodeIndex > 100) break;
                              }
                            }
                          });
                        }

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
                          let nodesToRender;

                          if (isBuilderVar) {
                            // For builder variables, show the CURRENT state at this step
                            // Look for the variable in current step, or walk backwards to find most recent state
                            let currentVariable = variables.find(
                              (v) => v.var_name === structure.rootVarName
                            );

                            // If not in current step (e.g., we're in a nested scope), find the most recent state
                            if (!currentVariable) {
                              for (let i = currentStep - 1; i >= 0; i--) {
                                const prevStepVars = steps[i]?.variables || [];
                                currentVariable = prevStepVars.find(
                                  (v) => v.var_name === structure.rootVarName
                                );
                                if (currentVariable) break;
                              }
                            }

                            if (currentVariable && currentVariable.value) {
                              // Get the linked list from the current variable value
                              const vizData = prepareVisualizationData(
                                currentVariable,
                                "linked_list"
                              );
                              nodesToRender = vizData.nodes;
                            } else {
                              // Fallback to structure nodes
                              nodesToRender = Array.from(
                                structure.nodes.entries()
                              )
                                .map(([nodeId, nodeValue]) => {
                                  const val =
                                    nodeValue.__attrs__?.val ??
                                    nodeValue.__attrs__?.value ??
                                    nodeValue.__attrs__?.data ??
                                    "?";
                                  return { id: nodeId, value: val };
                                })
                                .sort((a, b) => {
                                  const aIdx = parseInt(
                                    a.id.split("_").pop() || "0"
                                  );
                                  const bIdx = parseInt(
                                    b.id.split("_").pop() || "0"
                                  );
                                  return aIdx - bIdx;
                                });
                            }
                          } else {
                            // For input/traversal variables, show the FULL original structure
                            nodesToRender = Array.from(
                              structure.nodes.entries()
                            )
                              .map(([nodeId, nodeValue]) => {
                                const val =
                                  nodeValue.__attrs__?.val ??
                                  nodeValue.__attrs__?.value ??
                                  nodeValue.__attrs__?.data ??
                                  "?";
                                return { id: nodeId, value: val };
                              })
                              .sort((a, b) => {
                                const aIdx = parseInt(
                                  a.id.split("_").pop() || "0"
                                );
                                const bIdx = parseInt(
                                  b.id.split("_").pop() || "0"
                                );
                                return aIdx - bIdx;
                              });
                          }

                          return (
                            <div key={structId}>
                              <LinkedListVisualizer
                                data={{ nodes: nodesToRender }}
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
