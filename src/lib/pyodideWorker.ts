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

def trace_calls(frame, event, arg):
    """Trace function to capture execution steps."""
    try:
        if event not in ('line', 'call', 'return'):
            return trace_calls
        
        # Get current line and code
        lineno = frame.f_lineno
        filename = frame.f_code.co_filename
        
        # Only trace our code, not library code
        if filename != '<string>':
            return trace_calls
        
        # Get scope_id (function start line or 0 for module level)
        scope_id = frame.f_code.co_firstlineno if frame.f_code.co_name != '<module>' else 0
        
        # Capture local variables
        variables = []
        local_vars = frame.f_locals.copy()
        
        for var_name, value in local_vars.items():
            if var_name.startswith('__'):
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
