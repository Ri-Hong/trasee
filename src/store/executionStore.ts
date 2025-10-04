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

  setCode: (code: string) => void;
  setIsRunning: (isRunning: boolean) => void;
  setCurrentStep: (step: number) => void;
  setSteps: (steps: ExecutionStep[]) => void;
  addLog: (log: Omit<LogEntry, "timestamp">) => void;
  clearLogs: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
  stepForward: () => void;
  stepBack: () => void;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  code: "",
  isRunning: false,
  currentStep: 0,
  steps: [],
  logs: [],
  error: null,

  setCode: (code) => set({ code }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setSteps: (steps) => set({ steps, currentStep: 0 }),

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
}));
