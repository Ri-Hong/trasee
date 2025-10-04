import Editor, { Monaco } from "@monaco-editor/react";
import { useRef, useCallback, useEffect } from "react";
import { validatePythonCode } from "@/lib/pyodideWorker";

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validateCode = useCallback(async (code: string) => {
    if (!monacoRef.current || !editorRef.current || !code.trim()) {
      // Clear markers if empty
      if (monacoRef.current && editorRef.current) {
        monacoRef.current.editor.setModelMarkers(
          editorRef.current.getModel(),
          "python",
          []
        );
      }
      return;
    }

    try {
      const result = await validatePythonCode(code);

      // Check if editor still exists (user might have navigated away)
      if (!monacoRef.current || !editorRef.current) {
        return;
      }

      const monaco = monacoRef.current;
      const editor = editorRef.current;

      if (!result.errors || result.errors.length === 0) {
        // Clear all markers if no errors
        monaco.editor.setModelMarkers(editor.getModel(), "python", []);
        return;
      }

      // Convert validation errors to Monaco markers
      const markers = result.errors.map((error: any) => ({
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: error.line,
        startColumn: error.column + 1, // Monaco uses 1-based columns
        endLineNumber: error.end_line,
        endColumn: error.end_column + 1,
        message: error.message,
      }));

      monaco.editor.setModelMarkers(editor.getModel(), "python", markers);
    } catch (error) {
      console.error("Validation error:", error);
    }
  }, []);

  const debouncedValidate = useCallback(
    (code: string) => {
      // Clear previous timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }

      // Set new timeout
      validationTimeoutRef.current = setTimeout(() => {
        validateCode(code);
      }, 500); // 500ms debounce
    },
    [validateCode]
  );

  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    monacoRef.current = monaco;
    editorRef.current = editor;

    // Don't run validation on initial load to avoid freezing
    // It will run when the user starts editing
  }, []);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      onChange(newValue);
      if (newValue !== undefined) {
        debouncedValidate(newValue);
      }
    },
    [onChange, debouncedValidate]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full w-full bg-editor-bg rounded-lg overflow-hidden border border-border">
      <Editor
        height="100%"
        defaultLanguage="python"
        theme="vs-dark"
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: "on",
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}
