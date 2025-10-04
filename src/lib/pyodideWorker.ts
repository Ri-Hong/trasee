import { loadPyodide } from "pyodide";

let pyodideInstance: any = null;

export async function initializePyodide() {
  if (!pyodideInstance) {
    // Load Pyodide from CDN with matching version
    pyodideInstance = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/",
    });
  }
  return pyodideInstance;
}

export async function executePythonWithTrace(code: string) {
  const pyodide = await initializePyodide();

  // Create a tracer script that will capture execution steps
  const tracerScript = `
import sys
import json
import ast
import traceback

# Static Analysis: Find all variables and their scopes
def analyze_variables(code):
    """Parse code and extract variable declarations with their scopes."""
    try:
        tree = ast.parse(code)
        variables = {}
        
        def visit_node(node, scope_id=0, scope_name="<module>"):
            if isinstance(node, ast.FunctionDef):
                # Use line number as scope_id
                func_scope_id = node.lineno
                # Analyze function parameters
                for arg in node.args.args:
                    var_key = (func_scope_id, arg.arg)
                    variables[str(var_key)] = {
                        "scope_id": func_scope_id,
                        "var_name": arg.arg,
                        "type": "parameter",
                        "line_declared": node.lineno
                    }
                
                # Visit function body
                for child in ast.walk(node):
                    if isinstance(child, (ast.Assign, ast.AnnAssign, ast.AugAssign)):
                        targets = []
                        if isinstance(child, ast.Assign):
                            targets = child.targets
                        elif isinstance(child, ast.AnnAssign) and child.target:
                            targets = [child.target]
                        elif isinstance(child, ast.AugAssign):
                            targets = [child.target]
                        
                        for target in targets:
                            if isinstance(target, ast.Name):
                                var_key = (func_scope_id, target.id)
                                variables[str(var_key)] = {
                                    "scope_id": func_scope_id,
                                    "var_name": target.id,
                                    "type": "local",
                                    "line_declared": child.lineno
                                }
            
            elif isinstance(node, ast.ClassDef):
                # Track class definitions
                pass
        
        # Visit all nodes in the AST
        for node in ast.walk(tree):
            visit_node(node)
        
        return variables
    except Exception as e:
        return {"error": str(e)}

# Runtime Tracing
execution_steps = []
current_frame_vars = {}

# Variables to exclude (tracer internals)
TRACER_VARS = {
    '_pyodide_core', 'sys', 'json', 'ast', 'traceback', 'math',
    'analyze_variables', 'execution_steps', 'current_frame_vars',
    'trace_calls', 'serialize_value', 'run_with_trace', 'TRACER_VARS'
}

def trace_calls(frame, event, arg):
    """Trace function to capture execution steps."""
    try:
        if event not in ('line', 'call', 'return'):
            return trace_calls
        
        # Get current line and code
        lineno = frame.f_lineno
        filename = frame.f_code.co_filename
        function_name = frame.f_code.co_name
        
        # Only trace our code, not library code
        if filename != '<string>':
            return trace_calls
        
        # Skip tracing inside our tracer functions
        if function_name in ('analyze_variables', 'trace_calls', 'serialize_value', 'run_with_trace'):
            return trace_calls
        
        # Get scope_id (function start line or 0 for module level)
        scope_id = frame.f_code.co_firstlineno if function_name != '<module>' else 0
        
        # Capture local variables
        variables = []
        local_vars = frame.f_locals.copy()
        
        for var_name, value in local_vars.items():
            # Skip dunder variables
            if var_name.startswith('__'):
                continue
            
            # Skip tracer internals
            if var_name in TRACER_VARS:
                continue
            
            # Skip module types
            if type(value).__name__ == 'module':
                continue
            
            var_info = {
                "scope_id": scope_id,
                "var_name": var_name,
                "type": type(value).__name__,
                "value": serialize_value(value)
            }
            variables.append(var_info)
        
        # Record step
        step = {
            "line": lineno,
            "event": event,
            "variables": variables
        }
        execution_steps.append(step)
        
        return trace_calls
    except Exception as e:
        # Log error but continue tracing
        return trace_calls

def serialize_value(value, max_depth=5, current_depth=0):
    """Convert Python values to JSON-serializable format."""
    if current_depth > max_depth:
        return "<max_depth_reached>"
    
    # Handle None
    if value is None:
        return None
    
    # Handle primitives
    if isinstance(value, (bool, int, float, str)):
        if isinstance(value, str) and len(value) > 100:
            return value[:100] + "..."
        # Handle special float values that aren't valid JSON
        if isinstance(value, float):
            import math
            if math.isnan(value):
                return "NaN"
            elif math.isinf(value):
                return "Infinity" if value > 0 else "-Infinity"
        return value
    
    # Handle lists
    if isinstance(value, list):
        if len(value) > 20:
            return [serialize_value(v, max_depth, current_depth + 1) for v in value[:20]] + ["..."]
        return [serialize_value(v, max_depth, current_depth + 1) for v in value]
    
    # Handle tuples
    if isinstance(value, tuple):
        return [serialize_value(v, max_depth, current_depth + 1) for v in value]
    
    # Handle dicts
    if isinstance(value, dict):
        result = {}
        for k, v in list(value.items())[:20]:
            if isinstance(k, str):
                result[k] = serialize_value(v, max_depth, current_depth + 1)
        return result
    
    # Handle custom objects (like ListNode, TreeNode)
    if hasattr(value, '__dict__'):
        obj_dict = {}
        # Get object attributes
        for attr in dir(value):
            if attr.startswith('_'):
                continue
            try:
                attr_value = getattr(value, attr)
                if not callable(attr_value):
                    obj_dict[attr] = serialize_value(attr_value, max_depth, current_depth + 1)
            except:
                pass
        return {"__class__": type(value).__name__, "__attrs__": obj_dict}
    
    # Fallback
    return str(value)

def run_with_trace(code):
    """Execute code with tracing enabled."""
    global execution_steps
    execution_steps = []
    
    try:
        # Set up tracing
        sys.settrace(trace_calls)
        
        # Execute the code
        exec(code, globals())
        
        # Disable tracing
        sys.settrace(None)
        
        return {
            "status": "success",
            "steps": execution_steps
        }
    except Exception as e:
        sys.settrace(None)
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc(),
            "steps": execution_steps
        }

# Export functions
__all__ = ['analyze_variables', 'run_with_trace']
`;

  // Load the tracer
  await pyodide.runPythonAsync(tracerScript);

  // Run static analysis
  const staticAnalysisResult = await pyodide.runPythonAsync(`
import json
result = analyze_variables('''${code.replace(/'/g, "\\'")}''')
json.dumps(result, ensure_ascii=False)
  `);

  let staticAnalysis;
  try {
    staticAnalysis = JSON.parse(staticAnalysisResult);
  } catch (e) {
    console.error(
      "Failed to parse static analysis result:",
      staticAnalysisResult
    );
    throw new Error(`Static analysis JSON parse error: ${e.message}`);
  }

  // Run execution with tracing
  const executionResult = await pyodide.runPythonAsync(`
import json
result = run_with_trace('''${code.replace(/'/g, "\\'")}''')
json.dumps(result, ensure_ascii=False)
  `);

  let execution;
  try {
    execution = JSON.parse(executionResult);
  } catch (e) {
    console.error(
      "Failed to parse execution result:",
      executionResult.substring(0, 500)
    );
    throw new Error(`Execution result JSON parse error: ${e.message}`);
  }

  return {
    staticAnalysis,
    execution,
  };
}

export async function validatePythonCode(code: string) {
  const pyodide = await initializePyodide();

  // Create a validation script
  const validatorScript = `
import ast
import sys
import json
from typing import List, Dict, Any

def validate_code(code: str) -> Dict[str, Any]:
    """
    Validate Python code for syntax errors and undefined names.
    Returns a list of errors with line/column information.
    """
    errors = []
    
    # Check for syntax errors
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        errors.append({
            "severity": "error",
            "line": e.lineno if e.lineno else 1,
            "column": e.offset if e.offset else 1,
            "end_line": e.end_lineno if hasattr(e, 'end_lineno') and e.end_lineno else e.lineno if e.lineno else 1,
            "end_column": e.end_offset if hasattr(e, 'end_offset') and e.end_offset else (e.offset + 1) if e.offset else 2,
            "message": str(e.msg)
        })
        return {"errors": errors}
    except Exception as e:
        errors.append({
            "severity": "error",
            "line": 1,
            "column": 1,
            "end_line": 1,
            "end_column": 2,
            "message": f"Parse error: {str(e)}"
        })
        return {"errors": errors}
    
    # Check for undefined names using a scoped approach
    global_defined_names = set()
    
    # First pass: collect global definitions
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            global_defined_names.add(node.name)
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            for alias in node.names:
                global_defined_names.add(alias.asname if alias.asname else alias.name)
        elif isinstance(node, (ast.Assign, ast.AnnAssign)):
            targets = []
            if isinstance(node, ast.Assign):
                targets = node.targets
            elif isinstance(node, ast.AnnAssign) and node.target:
                targets = [node.target]
            
            for target in targets:
                if isinstance(target, ast.Name):
                    global_defined_names.add(target.id)
    
    # Add built-in names
    builtins = set(dir(__builtins__))
    
    # Track undefined names
    undefined_names = {}
    
    # Visitor that tracks scope
    class ScopedNameChecker(ast.NodeVisitor):
        def __init__(self):
            self.scope_stack = [global_defined_names | builtins]
        
        def visit_FunctionDef(self, node):
            # Create new scope with parameters
            func_scope = self.scope_stack[-1].copy()
            
            # Add 'self' or 'cls' for methods
            if node.args.args:
                for arg in node.args.args:
                    func_scope.add(arg.arg)
            
            # Add keyword-only arguments
            if node.args.kwonlyargs:
                for arg in node.args.kwonlyargs:
                    func_scope.add(arg.arg)
            
            # Push scope and visit body
            self.scope_stack.append(func_scope)
            
            # Visit function body
            for child in node.body:
                self.visit(child)
            
            # Pop scope
            self.scope_stack.pop()
        
        visit_AsyncFunctionDef = visit_FunctionDef
        
        def visit_ClassDef(self, node):
            # Visit class body with current scope
            for child in node.body:
                self.visit(child)
        
        def visit_Assign(self, node):
            # Visit the value first (right side)
            self.visit(node.value)
            
            # Then add targets to current scope (handle tuple unpacking)
            def add_names_from_target(target):
                if isinstance(target, ast.Name):
                    self.scope_stack[-1].add(target.id)
                elif isinstance(target, (ast.Tuple, ast.List)):
                    # Handle tuple/list unpacking like: a, b = values
                    for elt in target.elts:
                        add_names_from_target(elt)
            
            for target in node.targets:
                add_names_from_target(target)
        
        def visit_AnnAssign(self, node):
            # Visit the value first if it exists
            if node.value:
                self.visit(node.value)
            
            # Then add target to current scope
            if isinstance(node.target, ast.Name):
                self.scope_stack[-1].add(node.target.id)
        
        def visit_For(self, node):
            # Visit iterable first
            self.visit(node.iter)
            
            # Add loop variable(s) to scope (handle tuple unpacking)
            def add_names_from_target(target):
                if isinstance(target, ast.Name):
                    self.scope_stack[-1].add(target.id)
                elif isinstance(target, (ast.Tuple, ast.List)):
                    for elt in target.elts:
                        add_names_from_target(elt)
            
            add_names_from_target(node.target)
            
            # Visit body
            for child in node.body:
                self.visit(child)
            
            # Visit orelse
            for child in node.orelse:
                self.visit(child)
        
        def visit_Name(self, node):
            if isinstance(node.ctx, ast.Load):
                # Check if name is defined in any scope
                if node.id not in self.scope_stack[-1]:
                    # Record undefined name
                    if node.id not in undefined_names:
                        undefined_names[node.id] = {
                            "line": node.lineno,
                            "column": node.col_offset,
                            "end_line": node.end_lineno if hasattr(node, 'end_lineno') else node.lineno,
                            "end_column": node.end_col_offset if hasattr(node, 'end_col_offset') else node.col_offset + len(node.id),
                        }
        
        def visit_Attribute(self, node):
            # For attributes like obj.method, only check the base object
            self.visit(node.value)
    
    checker = ScopedNameChecker()
    checker.visit(tree)
    
    # Add errors for undefined names
    for name, location in undefined_names.items():
        errors.append({
            "severity": "error",
            "line": location["line"],
            "column": location["column"],
            "end_line": location["end_line"],
            "end_column": location["end_column"],
            "message": f"Name '{name}' is not defined"
        })
    
    return {"errors": errors}

__validation_result__ = None
`;

  // Load the validator
  await pyodide.runPythonAsync(validatorScript);

  // Run validation
  try {
    const result = await pyodide.runPythonAsync(`
import json
result = validate_code('''${code.replace(/'/g, "\\'")}''')
json.dumps(result, ensure_ascii=False)
    `);

    return JSON.parse(result);
  } catch (e) {
    console.error("Validation error:", e);
    return {
      errors: [
        {
          severity: "error",
          line: 1,
          column: 1,
          end_line: 1,
          end_column: 2,
          message: `Validation failed: ${e.message}`,
        },
      ],
    };
  }
}
