import { create } from "zustand";

export interface Variable {
  scope_id: number;
  var_name: string;
  type: string;
  value: any;
  data_structure?: string;
}

export interface ExecutionStep {
  line: number;
  variables: Variable[];
  event: string;
  scope_id?: number;
  function_name?: string;
  depth?: number;
}

export interface LogEntry {
  timestamp: Date;
  level: "info" | "success" | "warning" | "error";
  message: string;
  data?: any;
}

interface ExecutionState {
  code: string;
  isRunning: boolean;
  currentStep: number;
  steps: ExecutionStep[];
  logs: LogEntry[];
  error: string | null;
  visualizationMode: "global" | "scope";

  setCode: (code: string) => void;
  setIsRunning: (isRunning: boolean) => void;
  setCurrentStep: (step: number) => void;
  setSteps: (steps: ExecutionStep[]) => void;
  addLog: (log: Omit<LogEntry, "timestamp">) => void;
  clearLogs: () => void;
  setError: (error: string | null) => void;
  setVisualizationMode: (mode: "global" | "scope") => void;
  reset: () => void;
  stepForward: () => void;
  stepBack: () => void;
  stepInto: () => void;
  stepOver: () => void;
  stepOut: () => void;
  stepToNextIteration: () => void;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  code: "",
  isRunning: false,
  currentStep: 0,
  steps: [],
  logs: [],
  error: null,
  visualizationMode: "global",

  setCode: (code) => set({ code }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setSteps: (steps) => set({ steps, currentStep: 0 }),
  setVisualizationMode: (mode) => set({ visualizationMode: mode }),

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, { ...log, timestamp: new Date() }],
    })),

  clearLogs: () => set({ logs: [] }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      currentStep: 0,
      steps: [],
      logs: [],
      error: null,
      isRunning: false,
    }),

  stepForward: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  stepBack: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  stepInto: () => {
    // Step into is the same as step forward - just go to the next step
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  stepOver: () => {
    // Step over: skip to the next step at the same or shallower depth
    const { currentStep, steps } = get();
    if (currentStep >= steps.length - 1) return;

    const currentDepth = steps[currentStep].depth ?? 0;

    // Find the next step at same or shallower depth
    for (let i = currentStep + 1; i < steps.length; i++) {
      const stepDepth = steps[i].depth ?? 0;
      if (stepDepth <= currentDepth) {
        set({ currentStep: i });
        return;
      }
    }

    // If we didn't find one, just go to the last step
    set({ currentStep: steps.length - 1 });
  },

  stepOut: () => {
    // Step out: skip to the next step at a shallower depth (return from function)
    const { currentStep, steps } = get();
    if (currentStep >= steps.length - 1) return;

    const currentDepth = steps[currentStep].depth ?? 0;

    // Find the next step at shallower depth
    for (let i = currentStep + 1; i < steps.length; i++) {
      const stepDepth = steps[i].depth ?? 0;
      if (stepDepth < currentDepth) {
        set({ currentStep: i });
        return;
      }
    }

    // If we didn't find one, just go to the last step
    set({ currentStep: steps.length - 1 });
  },

  stepToNextIteration: () => {
    // Step to next iteration: find the next time we're at the same line (loop repeats)
    const { currentStep, steps } = get();
    if (currentStep >= steps.length - 1) return;

    const currentLine = steps[currentStep].line;
    const currentDepth = steps[currentStep].depth ?? 0;

    // Find the next step at the same line and depth (next iteration)
    for (let i = currentStep + 1; i < steps.length; i++) {
      const step = steps[i];
      if (step.line === currentLine && (step.depth ?? 0) === currentDepth) {
        set({ currentStep: i });
        return;
      }
    }

    // If we didn't find another iteration, go to the next step after the loop
    // (first step with shallower depth or different scope)
    for (let i = currentStep + 1; i < steps.length; i++) {
      const stepDepth = steps[i].depth ?? 0;
      if (stepDepth < currentDepth) {
        set({ currentStep: i });
        return;
      }
    }

    // If nothing found, go to last step
    set({ currentStep: steps.length - 1 });
  },
}));
