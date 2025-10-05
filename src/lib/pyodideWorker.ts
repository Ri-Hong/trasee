import { loadPyodide } from "pyodide";

let pyodideInstance: any = null;
let validatorLoaded = false;

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

# Analyze loops to determine which lines are inside loops
def analyze_loops(code):
    """Identify which lines are inside loop bodies and track iteration variables."""
    try:
        tree = ast.parse(code)
        loop_info = {}
        
        def get_iter_info(node):
            """Extract iterator information from for loop."""
            iter_name = None
            is_range = False
            is_enumerate = False
            
            # Check for range(len(x)) pattern
            if isinstance(node.iter, ast.Call):
                if isinstance(node.iter.func, ast.Name) and node.iter.func.id == 'range':
                    is_range = True
                    # Check if it's range(len(something))
                    if node.iter.args and isinstance(node.iter.args[0], ast.Call):
                        if isinstance(node.iter.args[0].func, ast.Name) and node.iter.args[0].func.id == 'len':
                            if node.iter.args[0].args and isinstance(node.iter.args[0].args[0], ast.Name):
                                iter_name = node.iter.args[0].args[0].id
                elif isinstance(node.iter.func, ast.Name) and node.iter.func.id == 'enumerate':
                    is_enumerate = True
                    if node.iter.args and isinstance(node.iter.args[0], ast.Name):
                        iter_name = node.iter.args[0].id
            # Direct iteration over a variable
            elif isinstance(node.iter, ast.Name):
                iter_name = node.iter.id
            
            return iter_name, is_range, is_enumerate
        
        def collect_line_numbers(node):
            """Recursively collect all line numbers in a node's body."""
            lines = set()
            if hasattr(node, 'lineno'):
                lines.add(node.lineno)
            for child in ast.walk(node):
                if hasattr(child, 'lineno'):
                    lines.add(child.lineno)
            return lines
        
        def visit_loop(node):
            # For loops
            if isinstance(node, ast.For):
                iter_name, is_range, is_enumerate = get_iter_info(node)
                
                # Handle target - could be a simple name or tuple unpacking
                target_name = None
                target_names = []
                if isinstance(node.target, ast.Name):
                    target_name = node.target.id
                    target_names = [target_name]
                elif isinstance(node.target, ast.Tuple):
                    # Tuple unpacking like: for i, num in enumerate(...)
                    target_names = [elt.id for elt in node.target.elts if isinstance(elt, ast.Name)]
                    if target_names:
                        target_name = target_names[0]  # Use first element (usually the index)
                
                # Debug print
                print(f"LOOP ANALYSIS: target={target_name}, targets={target_names}, iter={iter_name}, is_range={is_range}, is_enum={is_enumerate}")
                
                # Get all line numbers in the loop body (not including nested structures)
                lines = set()
                for stmt in node.body:
                    lines.update(collect_line_numbers(stmt))
                
                # Store loop info for all lines in the loop body
                for lineno in lines:
                    loop_info[lineno] = {
                        'type': 'for',
                        'target': target_name,
                        'target_names': target_names,
                        'iter': iter_name,
                        'is_range': is_range,
                        'is_enumerate': is_enumerate
                    }
            # While loops
            elif isinstance(node, ast.While):
                lines = set()
                for stmt in node.body:
                    lines.update(collect_line_numbers(stmt))
                for lineno in lines:
                    loop_info[lineno] = {
                        'type': 'while'
                    }
        
        for node in ast.walk(tree):
            visit_loop(node)
        
        return loop_info
    except Exception as e:
        return {}

# Runtime Tracing
execution_steps = []
current_frame_vars = {}
call_stack_depth = 0
loop_info = {}  # Will be populated in run_with_trace
iter_indices = {}  # Track iteration indices for each loop variable

# Variables to exclude (tracer internals and common Python conventions)
TRACER_VARS = {
    '_pyodide_core', 'sys', 'json', 'ast', 'traceback', 'math',
    'analyze_variables', 'execution_steps', 'current_frame_vars',
    'trace_calls', 'serialize_value', 'run_with_trace', 'TRACER_VARS',
    'call_stack_depth', 'capture_variables', 'self', 'analyze_loops',
    'loop_info', 'iter_indices'
}

def capture_variables(frame):
    """Helper to capture variables from a frame."""
    scope_id = frame.f_code.co_firstlineno if frame.f_code.co_name != '<module>' else 0
    variables = []
    
    # For module-level code, use frame.f_globals which contains the exec globals
    # For functions, use frame.f_locals
    if frame.f_code.co_name == '<module>':
        local_vars = frame.f_globals.copy()
    else:
        local_vars = frame.f_locals.copy()
    
    # Check if we're in a constructor
    is_constructor = (
        frame.f_code.co_name == '__init__' and
        'self' in local_vars and
        type(local_vars['self']).__name__ != 'module'
    )
    
    # If we're in a constructor, get variables from parent scope instead
    if is_constructor:
        if frame.f_back and frame.f_back.f_code.co_filename == '<string>':
            return capture_variables(frame.f_back)
        return []
    
    # For non-constructor scopes, process local variables
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
        
        # If this is a loop iteration variable, add its index
        lineno = frame.f_lineno
        if lineno in loop_info and loop_info[lineno]['type'] == 'for':
            target = loop_info[lineno]['target']
            target_names = loop_info[lineno].get('target_names', [])
            iterable = loop_info[lineno]['iter']
            is_range = loop_info[lineno].get('is_range', False)
            is_enumerate = loop_info[lineno].get('is_enumerate', False)
            
            # Debug: print loop info
            print(f"DEBUG: var={var_name}, target={target}, targets={target_names}, iter={iterable}, is_range={is_range}, is_enum={is_enumerate}, value={value}, type={type(value).__name__}")
            
            # Check if this is the loop variable
            if target == var_name or var_name in target_names:
                # Case 1: for i in nums (iterate over list)
                if iterable and iterable in local_vars and not is_range and not is_enumerate:
                    iter_list = local_vars[iterable]
                    if isinstance(iter_list, list):
                        # Find the index of the current value in the list
                        try:
                            index = iter_list.index(value)
                            # Add a special variable to track the index
                            variables.append({
                                "scope_id": scope_id,
                                "var_name": f"__{var_name}_index",
                                "type": "int",
                                "value": index
                            })
                            print(f"DEBUG: Added index tracker for {var_name}, index={index}")
                        except ValueError:
                            pass
                
                # Case 2: for i in range(len(nums)) (iterate over index)
                # In this case, i IS the index, so just add it directly
                elif is_range and isinstance(value, int) and iterable:
                    print(f"DEBUG: Range loop detected, iter={iterable}, value={value}, iterable in local_vars={iterable in local_vars}")
                    if iterable in local_vars:
                        # We know which list this is for
                        variables.append({
                            "scope_id": scope_id,
                            "var_name": f"__{var_name}_index",
                            "type": "int",
                            "value": value
                        })
                        print(f"DEBUG: Added index tracker for {var_name} (range), index={value}")
                
                # Case 3: for i, val in enumerate(nums)
                # Only the FIRST variable (i) is the index
                elif is_enumerate and isinstance(value, int) and iterable and var_name == target_names[0]:
                    print(f"DEBUG: Enumerate loop detected, iter={iterable}, value={value}, var={var_name}")
                    if iterable in local_vars and isinstance(local_vars[iterable], list):
                        # This variable (i) is the index itself
                        variables.append({
                            "scope_id": scope_id,
                            "var_name": f"__{var_name}_index",
                            "type": "int",
                            "value": value
                        })
                        print(f"DEBUG: Added index tracker for {var_name} (enumerate), index={value}")
    
    return variables

def trace_calls(frame, event, arg):
    """Trace function to capture execution steps."""
    global call_stack_depth, loop_info
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
        if function_name in ('analyze_variables', 'trace_calls', 'serialize_value', 'run_with_trace', 'capture_variables', 'analyze_loops'):
            return trace_calls
        
        # Get scope_id
        scope_id = frame.f_code.co_firstlineno if function_name != '<module>' else 0
        
        # Update call stack depth
        if event == 'call':
            call_stack_depth += 1
        elif event == 'return':
            pass  # Will decrement after recording
        
        # Capture variables at this moment (before line executes)
        variables = capture_variables(frame)
        
        # Check if current line is in a loop
        in_loop = lineno in loop_info
        
        # Record step
        step = {
            "line": lineno,
            "event": event,
            "variables": variables,
            "scope_id": scope_id,
            "call_depth": call_stack_depth,
            "in_loop": in_loop
        }
        execution_steps.append(step)
        
        # Decrement depth after recording return
        if event == 'return':
            call_stack_depth = max(0, call_stack_depth - 1)
        
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
            # Convert key to string for JSON compatibility
            key_str = str(k)
            result[key_str] = serialize_value(v, max_depth, current_depth + 1)
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
    global execution_steps, call_stack_depth, loop_info
    execution_steps = []
    call_stack_depth = 0
    
    # Analyze which lines are in loops and get iteration info
    loop_info = analyze_loops(code)
    
    try:
        # Create a fresh namespace for each execution
        # This prevents variables from previous runs from persisting
        exec_globals = {
            '__builtins__': __builtins__,
            '__name__': '__main__',
            '__doc__': None,
            '__package__': None
        }
        
        # Set up tracing
        sys.settrace(trace_calls)
        
        # Execute the code in the fresh namespace
        exec(code, exec_globals)
        
        # Disable tracing
        sys.settrace(None)
        
        # Post-process: shift variable states forward by one step
        # This makes each step show the state AFTER the line executed, not before
        if len(execution_steps) > 1:
            for i in range(len(execution_steps) - 1):
                # Copy variables from next step to current step
                execution_steps[i]["variables"] = execution_steps[i + 1]["variables"]
            
            # For the last step, capture the final state from exec_globals
            final_variables = []
            for var_name, value in exec_globals.items():
                if var_name.startswith('__') or var_name in TRACER_VARS:
                    continue
                if type(value).__name__ == 'module':
                    continue
                
                var_info = {
                    "scope_id": execution_steps[-1]["scope_id"],
                    "var_name": var_name,
                    "type": type(value).__name__,
                    "value": serialize_value(value)
                }
                final_variables.append(var_info)
            
            execution_steps[-1]["variables"] = final_variables
        
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

  // Only load the validator script once
  if (!validatorLoaded) {
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

    // Load the validator script only once
    await pyodide.runPythonAsync(validatorScript);
    validatorLoaded = true;
  }

  // Run validation
  try {
    const result = await pyodide.runPythonAsync(`
import json
result = validate_code('''${code.replace(/'/g, "\\'")}''')
json.dumps(result, ensure_ascii=False)
    `);

    return JSON.parse(result);
  } catch (e: any) {
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
