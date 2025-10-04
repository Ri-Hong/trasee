import { useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { ControlPanel } from "@/components/ControlPanel";
import { VisualizationPanel } from "@/components/VisualizationPanel";
import { VariablesPanel } from "@/components/VariablesPanel";
import { LogConsole } from "@/components/LogConsole";
import { useExecutionStore } from "@/store/executionStore";
import { executePythonWithTrace } from "@/lib/pyodideWorker";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

const DEFAULT_CODE = `# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def addTwoNumbers(l1: ListNode, l2: ListNode) -> ListNode:
    dummy = ListNode()
    curr = dummy
    carry = 0
    
    while l1 or l2 or carry:
        v1 = l1.val if l1 else 0
        v2 = l2.val if l2 else 0
        
        s = v1 + v2 + carry
        carry, digit = divmod(s, 10)
        
        curr.next = ListNode(digit)
        curr = curr.next
        
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
    
    return dummy.next

# Test the function
l1 = ListNode(2, ListNode(4, ListNode(3)))
l2 = ListNode(5, ListNode(6, ListNode(4)))
result = addTwoNumbers(l1, l2)
`;

const Index = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const {
    isRunning,
    setIsRunning,
    currentStep,
    steps,
    setSteps,
    addLog,
    clearLogs,
    reset,
    stepForward,
    stepBack,
    setError,
  } = useExecutionStore();

  const handleRun = async () => {
    setIsRunning(true);
    clearLogs();
    setError(null);

    try {
      addLog({ level: "info", message: "🚀 Starting execution..." });
      addLog({
        level: "info",
        message:
          "Initializing Pyodide (this may take a moment on first run)...",
      });

      // Execute with tracing
      const result = await executePythonWithTrace(code);

      // Log static analysis
      addLog({
        level: "success",
        message: "✅ Static analysis complete",
        data: result.staticAnalysis,
      });

      if (result.execution.status === "error") {
        addLog({
          level: "error",
          message: `❌ Execution error: ${result.execution.error}`,
          data: { traceback: result.execution.traceback },
        });
        setError(result.execution.error);
        toast.error("Execution failed. Check the log for details.");
      } else {
        addLog({
          level: "success",
          message: `✅ Execution completed successfully with ${result.execution.steps.length} steps`,
        });

        // Set the execution steps
        setSteps(result.execution.steps);

        // Log data structure detection
        if (result.execution.steps.length > 0) {
          // Collect all unique variables across all steps (not just the last one)
          const allVariablesMap = new Map<string, any>();

          result.execution.steps.forEach((step: any) => {
            step.variables.forEach((v: any) => {
              // Use scope_id + var_name as unique key
              const key = `${v.scope_id}_${v.var_name}`;

              // Skip functions, types, modules
              if (
                [
                  "function",
                  "type",
                  "module",
                  "method",
                  "builtin_function_or_method",
                ].includes(v.type)
              ) {
                return;
              }

              // Keep the latest value for each variable
              allVariablesMap.set(key, v);
            });
          });

          const dataStructures = Array.from(allVariablesMap.values()).map(
            (v: any) => ({
              name: v.var_name,
              type: v.type,
              scope_id: v.scope_id,
            })
          );

          if (dataStructures.length > 0) {
            addLog({
              level: "info",
              message: "🔍 Data structures detected",
              data: dataStructures,
            });
          }
        }

        toast.success("Code executed successfully!");
      }
    } catch (error: any) {
      addLog({
        level: "error",
        message: `❌ Fatal error: ${error.message}`,
        data: { stack: error.stack },
      });
      setError(error.message);
      toast.error("Fatal error during execution");
    } finally {
      setIsRunning(false);
    }
  };

  const handleStepForward = () => {
    stepForward();
  };

  const handleStepBack = () => {
    stepBack();
  };

  const handleReset = () => {
    reset();
    setCode(DEFAULT_CODE);
    toast.info("Reset to default code");
  };

  const canStepBack = currentStep > 0;
  const canStepForward = currentStep < steps.length - 1;
  const currentLine = steps[currentStep]?.line;

  return (
    <div className="flex flex-col h-screen bg-background">
      <ControlPanel
        onRun={handleRun}
        onStepForward={handleStepForward}
        onStepBack={handleStepBack}
        onReset={handleReset}
        isRunning={isRunning}
        canStepBack={canStepBack}
        canStepForward={canStepForward}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Code Editor & Logs */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60} minSize={20}>
              <div className="h-full p-4">
                <CodeEditor
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  currentLine={currentLine}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={40} minSize={15}>
              <LogConsole />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Visualization & Variables */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60} minSize={20}>
              <VisualizationPanel />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={40} minSize={15}>
              <VariablesPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
