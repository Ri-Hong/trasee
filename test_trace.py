import sys

exec_globals_ref = None
pending_steps = {}
execution_steps = []

def capture_variables():
    global exec_globals_ref
    variables = {}
    if exec_globals_ref:
        for k, v in exec_globals_ref.items():
            if not k.startswith('__'):
                variables[k] = v
    return variables

def trace_calls(frame, event, arg):
    global pending_steps, exec_globals_ref
    
    if frame.f_code.co_filename != '<string>':
        return trace_calls
    
    lineno = frame.f_lineno
    frame_id = id(frame)
    
    # Record pending step with current variables
    if frame_id in pending_steps:
        pending = pending_steps[frame_id]
        vars_now = capture_variables()
        print(f"Recording line {pending['line']} with vars: {vars_now}")
        execution_steps.append({
            'line': pending['line'],
            'vars': vars_now
        })
        del pending_steps[frame_id]
    
    # Store current line as pending
    if event != 'return':
        pending_steps[frame_id] = {'line': lineno}
    
    return trace_calls

code = """myD = {}
for i in range(3):
    myD[i] = i
"""

exec_globals = {'__builtins__': __builtins__}
exec_globals_ref = exec_globals

sys.settrace(trace_calls)
exec(code, exec_globals)
sys.settrace(None)

print("\nFinal steps:")
for step in execution_steps:
    print(f"Line {step['line']}: {step['vars']}")
