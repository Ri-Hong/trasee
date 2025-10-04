I want to build a tool for visualizing data structures as the code is executed. We wil start off only supporting python.

The interface of the tool will be a code-editor like interface.

The second feature is data structure visualization. I'm thinking something heavily inspired by online python visualizers like https://pythontutor.com/visualize.html#mode=edit. The user should be able to paste a piece of python code into the editor, and then click a button to trace the code. During the trace, we will display all variables and their values at each step. To make this better than existing visualizers, I want to be able to adapt to differnt types of data structures and visualize them differnetly. For example, if they'r eusing a linked list, we should visualize it as a linked list, if they're building a tree, we should visualize it as a tree, etc.

I think a strong usecase of feature 2 is to understand and trace leetcode solutions. Here are some characteristics of leetcode solutions:

- They are usualy short in length (maybe 20-50 lines of code)
- They usually use one or more data structures like lists, dictionaries, trees, graphs, etc

My current approach is as follows:

1. We will perform static analysis to detect variables and their scopes in the code. Each variable will be uniquely identified by a tuple of (scope_id, var_name), where:

   - scope_id is simply the function's start line number (or frame id for runtime scopes)
   - var_name is the variable's identifier in the code
     This approach ensures proper handling of variables across different scopes within the file.

2. We will then track and analyze the variables during execution using a hybrid approach:
   a. There is a distinction between variable types and data structures. For example, if we have `head = Node()`, then head is a variable of type Node, but the data structure of head is a linked list.
   b. We use Python's sys.settrace functionality to capture accurate runtime values and object states at each execution step.
   c. The LLM analyzes these runtime values to infer the higher-level data structures (e.g., recognizing a linked list from node.next patterns, or a tree from node.left/right patterns).
3. We will then allow the user to trace the code step by step. During the trace, we will display all variables and their values at each step. We will have a visualizer for each data structure, which will be chosen based on the inferred data structure.

Example flow:
User pastes in the code (adding two numbers in a linked list):

```python
# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def addTwoNumbers(self, l1: ListNode, l2: ListNode) -> ListNode:
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
```

We run the static analysis to identify variables and their scopes:

```python
{
    # scope_id = 7 (function start line)
    (7, "l1"): {"type": "ListNode", "line_declared": 7},
    (7, "l2"): {"type": "ListNode", "line_declared": 7},
    (7, "dummy"): {"type": "ListNode", "line_declared": 8},
    (7, "curr"): {"type": "ListNode", "line_declared": 9},
    (7, "carry"): {"type": "int", "line_declared": 10},
    (7, "v1"): {"type": "int", "line_declared": 13},
    (7, "v2"): {"type": "int", "line_declared": 14},
    (7, "s"): {"type": "int", "line_declared": 16},
    (7, "digit"): {"type": "int", "line_declared": 17}
}
```

During execution, sys.settrace captures the actual runtime values and structure at each step. For example:

```python
# At line 16, after executing s = v1 + v2 + carry:

# Runtime values from sys.settrace:
{
    (7, "l1"): {"type": "ListNode", "value": {"val": 2, "next": {"val": 4, "next": {"val": 3, "next": null}}}},
    (7, "l2"): {"type": "ListNode", "value": {"val": 5, "next": {"val": 6, "next": {"val": 4, "next": null}}}},
    (7, "dummy"): {"type": "ListNode", "value": {"val": 0, "next": {"val": 7, "next": null}}},
    (7, "curr"): {"type": "ListNode", "value": {"val": 7, "next": null}},
    (7, "carry"): {"value": 1},
    (7, "v1"): {"value": 2},
    (7, "v2"): {"value": 5},
    (7, "s"): {"value": 8}
}

# Data structure inference by LLM:
{
    (7, "l1"): "linked_list",      # Inferred from repeated .next references
    (7, "l2"): "linked_list",      # Inferred from repeated .next references
    (7, "dummy"): "linked_list",   # Inferred from .next usage
    (7, "curr"): "linked_list",    # Inferred from being a node in the list
    (7, "carry"): "num",          # Inferred from arithmetic usage
    (7, "v1"): "num",            # Inferred from arithmetic usage
    (7, "v2"): "num",            # Inferred from arithmetic usage
    (7, "s"): "num"              # Inferred from arithmetic usage
}
```

Note that num is a generic type for numbers. All numbers like ints, floats, should be represented as num

# 🧰 Tech Stack

This project runs entirely in the browser, with no backend required. Python code execution, static analysis, tracing, and visualization all happen client-side.

## 🖼️ Frontend Framework

- **Next.js (React + TypeScript)**
  - Provides a robust foundation for building the editor interface, visualization canvas, and stepper controls.
  - Supports static export for easy hosting (e.g., Vercel, GitHub Pages).
- **Tailwind CSS + shadcn/ui**
  - Used for building a modern, responsive UI with minimal custom CSS.
  - Shadcn provides pre-styled components that integrate seamlessly with Tailwind.

---

## 📝 Code Editor

- **Monaco Editor**
  - The same editor used by VS Code.
  - Provides Python syntax highlighting, autocomplete, error squiggles, and breakpoint support.

---

## 🐍 Python Execution

- **Pyodide (CPython compiled to WebAssembly)**
  - Runs Python fully in the browser in a secure sandboxed environment.
  - Supports the standard library and many common Python packages out of the box.
  - Integrated via a Web Worker to keep the UI responsive.
- **`sys.settrace` instrumentation**
  - Used to intercept line-by-line execution events during runtime.
  - Captures variable states and heap references at each step, emitting JSON snapshots back to the main thread.

---

## 🧠 Static Analysis

- **Python `ast` module (inside Pyodide)**
  - Parses the code to extract variable declarations, scopes, and line numbers.
  - Used to precompute tracked variables before execution.
- **TypeScript shape inference layer**
  - Heuristic-based detection of common data structures from runtime values, including:
    - Linked lists (`.next` traversal)
    - Binary trees (`.left` / `.right`)
    - Graphs (adjacency lists)
    - Stacks, queues, matrices, and dictionaries

---

## 🌳 Visualization

- **React Flow**
  - Interactive graph rendering for linked lists, trees, and graphs.
  - Supports draggable nodes, animations, and custom layouts.
- **ELK.js + d3-hierarchy**
  - Auto-generates clean layouts for trees and layered graphs.
- **Custom React components**
  - `LinkedListRenderer`, `TreeRenderer`, `GraphRenderer`, `TableRenderer`, etc.
  - Each consumes a normalized “shape model” generated from trace data.

---

## ⏯️ State Management & Playback

- **Zustand**
  - Lightweight state store for execution steps, playback controls, and visualization settings.
- **Timeline Engine (custom)**
  - Computes diffs between execution steps.
  - Supports:
    - Play / Pause / Step Forward / Step Back
    - Jump to next change
    - Timeline scrubber

---

## 💾 Data Persistence & Sharing

- None, no need to store state in the browser or on the backend

---

## 🤖 On-device AI (No Backend)

- **WebLLM or Transformers.js**
  - Enables local WebGPU-accelerated LLM inference.
  - Used to generate natural language explanations of data structure changes (e.g., “Created node 7 and linked to `curr.next`”) fully on-device.

---

## ☁️ Deployment

- **Vercel or GitHub Pages**
  - The app is fully static — deployment is as simple as pushing to main.
  - No servers, databases, or backend APIs are needed.
