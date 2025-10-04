import { Play, StepForward, StepBack, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ControlPanelProps {
  onRun: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  isRunning: boolean;
  canStepBack: boolean;
  canStepForward: boolean;
}

export function ControlPanel({
  onRun,
  onStepForward,
  onStepBack,
  onReset,
  isRunning,
  canStepBack,
  canStepForward,
}: ControlPanelProps) {
  return (
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
        <Button
          onClick={onStepBack}
          disabled={!canStepBack || isRunning}
          variant="secondary"
          size="sm"
        >
          <StepBack className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={onStepForward}
          disabled={!canStepForward || isRunning}
          variant="secondary"
          size="sm"
        >
          <StepForward className="w-4 h-4" />
        </Button>
      </div>
      
      <Button
        onClick={onReset}
        variant="outline"
        size="sm"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>
      
      <div className="ml-auto text-sm text-muted-foreground">
        Python Code Visualizer
      </div>
    </div>
  );
}
