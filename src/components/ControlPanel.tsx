import {
  Play,
  StepForward,
  StepBack,
  RotateCcw,
  ArrowDownToLine,
  ArrowRightToLine,
  ArrowUpFromLine,
  HelpCircle,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExamplesLibrary } from "@/components/ExamplesLibrary";

interface ControlPanelProps {
  onRun: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onStepInto: () => void;
  onStepOver: () => void;
  onStepOut: () => void;
  onStepToNextIteration: () => void;
  onReset: () => void;
  onLoadExample: (code: string) => void;
  isRunning: boolean;
  canStepBack: boolean;
  canStepForward: boolean;
}

export function ControlPanel({
  onRun,
  onStepForward,
  onStepBack,
  onStepInto,
  onStepOver,
  onStepOut,
  onStepToNextIteration,
  onReset,
  onLoadExample,
  isRunning,
  canStepBack,
  canStepForward,
}: ControlPanelProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-4 bg-card border-b border-border">
        <Button
          onClick={onRun}
          disabled={isRunning}
          className="bg-gradient-success hover:opacity-90 transition-opacity"
          size="sm"
        >
          <Play className="w-4 h-4 mr-2" />
          Run
        </Button>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onStepBack}
                disabled={!canStepBack || isRunning}
                variant="secondary"
                size="sm"
              >
                <StepBack className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Step Back</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onStepForward}
                disabled={!canStepForward || isRunning}
                variant="secondary"
                size="sm"
              >
                <StepForward className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Step Forward</TooltipContent>
          </Tooltip>
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onStepInto}
                disabled={!canStepForward || isRunning}
                variant="secondary"
                size="sm"
              >
                <ArrowDownToLine className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Step Into (F11)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onStepOver}
                disabled={!canStepForward || isRunning}
                variant="secondary"
                size="sm"
              >
                <ArrowRightToLine className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Step Over (F10)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onStepOut}
                disabled={!canStepForward || isRunning}
                variant="secondary"
                size="sm"
              >
                <ArrowUpFromLine className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Step Out (Shift+F11)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onStepToNextIteration}
                disabled={!canStepForward || isRunning}
                variant="secondary"
                size="sm"
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Step to Next Iteration</TooltipContent>
          </Tooltip>
        </div>

        <Button onClick={onReset} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mt-[2px]" />
          Reset
        </Button>

        <ExamplesLibrary onSelectExample={onLoadExample} />

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-2">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Debugger Controls</DialogTitle>
              <DialogDescription>
                Learn how to navigate through your code execution
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4 overflow-y-auto pr-2">
              <div>
                <h3 className="font-semibold text-lg mb-2">Basic Controls</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Play className="w-5 h-5 mt-0.5 text-green-500" />
                    <div>
                      <p className="font-medium">Run</p>
                      <p className="text-sm text-muted-foreground">
                        Execute the code and capture all execution steps for
                        visualization
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <StepBack className="w-5 h-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Step Back</p>
                      <p className="text-sm text-muted-foreground">
                        Go back to the previous execution step
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <StepForward className="w-5 h-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Step Forward</p>
                      <p className="text-sm text-muted-foreground">
                        Move to the next execution step
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-2">
                  Advanced Stepping
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <ArrowDownToLine className="w-5 h-5 mt-0.5 text-blue-500" />
                    <div>
                      <p className="font-medium">Step Into (F11)</p>
                      <p className="text-sm text-muted-foreground">
                        Go to the very next line of execution. If the current
                        line calls a function, this will take you{" "}
                        <strong>inside that function</strong> to see its
                        execution step by step.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Use when: You want to debug what happens inside a
                        function call
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ArrowRightToLine className="w-5 h-5 mt-0.5 text-purple-500" />
                    <div>
                      <p className="font-medium">Step Over (F10)</p>
                      <p className="text-sm text-muted-foreground">
                        Execute the current line but stay at the current scope
                        level. If the line calls a function, it executes the{" "}
                        <strong>entire function</strong> and stops at the next
                        line in your current scope.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Use when: You trust a function works and don't want to
                        see its internals
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ArrowUpFromLine className="w-5 h-5 mt-0.5 text-orange-500" />
                    <div>
                      <p className="font-medium">Step Out (Shift+F11)</p>
                      <p className="text-sm text-muted-foreground">
                        Execute until you{" "}
                        <strong>exit the current function</strong> and return to
                        wherever it was called. Useful when you've stepped into
                        a function but want to quickly return.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Use when: You've seen enough of the current function and
                        want to return to the caller
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Repeat className="w-5 h-5 mt-0.5 text-cyan-500" />
                    <div>
                      <p className="font-medium">Step to Next Iteration</p>
                      <p className="text-sm text-muted-foreground">
                        Skip ahead to the{" "}
                        <strong>next iteration of the current loop</strong>.
                        This jumps to the next time the current line executes in
                        the next iteration, skipping all remaining lines in the
                        current iteration.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Use when: You're in a loop and want to skip ahead to see
                        how the next iteration behaves
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Example: Functions
                </h3>
                <div className="bg-muted p-3 rounded text-sm font-mono mt-2">
                  <div>1: def helper(x):</div>
                  <div>2: &nbsp;&nbsp;return x * 2</div>
                  <div>3: </div>
                  <div>4: result = helper(5) ← You're here</div>
                  <div>5: print(result)</div>
                </div>
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  <p>
                    • <strong>Step Into</strong> → Goes to line 2 (inside helper
                    function)
                  </p>
                  <p>
                    • <strong>Step Over</strong> → Goes to line 5 (executes
                    helper, stays in main scope)
                  </p>
                  <p>
                    • <strong>Step Out</strong> → N/A (you're already in the
                    top-level scope)
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Loops & Iterations
                </h3>
                <div className="bg-muted p-3 rounded text-sm font-mono mt-2">
                  <div>1: for i in range(3):</div>
                  <div>2: &nbsp;&nbsp;x = i * 2 ← You're here (i=0)</div>
                  <div>3: &nbsp;&nbsp;print(x)</div>
                  <div>4: print("done")</div>
                </div>
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  <p>
                    • <strong>Step Into / Step Over</strong> → Goes to line 3
                    (next line in loop body)
                  </p>
                  <p className="ml-4 text-xs">
                    Note: For loops, both buttons work the same since loops
                    don't change function depth. You'll step through each line
                    of each iteration.
                  </p>
                  <p>
                    • <strong>Step to Next Iteration</strong> (
                    <Repeat className="w-3 h-3 inline" />) → Jumps to the next
                    time this same line executes (next iteration)
                  </p>
                  <p className="ml-4 text-xs">
                    Perfect for skipping the rest of the current iteration and
                    going straight to the next one!
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="ml-auto text-sm text-muted-foreground">
          Trasee - Python Code Visualizer
        </div>
      </div>
    </TooltipProvider>
  );
}
