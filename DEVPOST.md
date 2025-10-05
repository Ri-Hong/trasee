## Inspiration

We've all been there - staring at a LeetCode solution that _should_ make sense, but the mental model just isn't clicking. You read through the code line by line, trying to visualize how the linked list nodes connect, or how the tree recursion unfolds, but it's like trying to watch a movie by reading the script.

Tools like Python Tutor helped, but they treat all variables the same way - showing a list node the same as an integer. We thought: **what if the visualizer could understand data structures the way we do?** What if it could recognize when you're building a linked list and show you those beautiful node chains, or detect a tree and render it hierarchically?

That's why we built Trasee - a Python visualizer that doesn't just trace your code, it _understands_ it.

## What it does

Trasee is an intelligent Python code tracer that runs entirely in your browser. Here's what makes it special:

**🧠 Smart Data Structure Recognition**

- Automatically detects linked lists (via `.next` patterns)
- Recognizes binary trees (via `.left`/`.right` structures)
- Identifies graphs, stacks, queues, and more
- Each structure gets its own beautiful, specialized visualization

**⏯️ Time-Travel Debugging**

- Step forward and backward through execution
- Watch your data structures evolve in real-time
- See every variable's value at each step
- Jump to the next change instantly

**🐍 Fully Client-Side**

- No backend required - everything runs in your browser
- Powered by Pyodide (CPython compiled to WebAssembly)
- Executes safely in a sandboxed Web Worker
- Works offline once loaded

**Perfect for:**

- Understanding complex LeetCode solutions
- Learning algorithms visually
- Debugging tricky data structure manipulations
- Teaching CS concepts with live demonstrations

## How we built it

Building Trasee was an exciting journey of piecing together multiple cutting-edge web technologies:

**Frontend Architecture**

- **React + TypeScript + Vite** for a fast, type-safe development experience
- **Monaco Editor** to give users a VS Code-like editing experience right in the browser
- **Tailwind CSS + shadcn/ui** for a polished, accessible interface
- **Zustand** for lightweight state management across execution steps

**Python Execution Engine**

- **Pyodide** - We run actual CPython in the browser via WebAssembly
- **Web Workers** - Isolated Python execution to keep the UI responsive
- **sys.settrace** - Python's built-in tracing hooks let us capture every line execution, variable change, and function call
- Custom instrumentation code to serialize Python objects into JSON for the frontend

**The Intelligence Layer**
This was the most challenging part. We built a two-phase analysis system:

1. **Static Analysis** - Using Python's `ast` module (running in Pyodide), we parse the code to identify:

   - All variable declarations and their scopes
   - Function boundaries
   - Type hints that give us clues about data structures

2. **Runtime Inference** - As code executes, we analyze the actual object structures:
   - Objects with `.next` attributes → Linked List
   - Objects with `.left`/`.right` → Binary Tree
   - Dictionaries with node keys → Graph
   - And many more patterns...

**Visualization Magic**

- **React Flow** for interactive, draggable node-based visualizations
- Custom renderers for each data structure type
- Auto-layout algorithms to position nodes beautifully
- Smooth animations as structures change between steps

## Challenges we ran into

**1. Serializing Python Objects to JSON**
Python's sys.settrace gives us access to local variables, but they're Python objects living in Pyodide's memory. Getting them across the Worker boundary was tricky:

- Had to recursively traverse object graphs
- Detect and break circular references (common in linked lists!)
- Handle complex types like custom classes, None, and numpy arrays
- Balance between sending too much data (slow) vs too little (incomplete visualizations)

**2. Scope Tracking**
Python's scoping is complex. We needed to distinguish between:

- Variables with the same name in different functions
- Nested function scopes
- Class methods and their `self` variables
- Global vs local variables

We solved this by creating unique identifiers `(scope_id, var_name)` tuples and tracking the call stack depth.

**3. Data Structure Detection Without AI**
Initially, we wanted to use an LLM for data structure inference, but:

- Running models in-browser was too slow
- We wanted instant feedback as users stepped through code
- Privacy concerns with sending code to external APIs

We pivoted to a heuristic-based approach using TypeScript. It's fast, deterministic, and works surprisingly well for common patterns!

**4. Performance with Large Execution Traces**
Some algorithms generate thousands of execution steps. We had to:

- Implement efficient diff algorithms to only store changes
- Lazy-load visualization data
- Debounce rapid step-through actions
- Optimize React re-renders with careful memoization

**5. Monaco Editor Integration**
Getting Monaco to play nice with React and Web Workers required:

- Custom TypeScript definitions
- Careful memory management to avoid leaks
- Syntax highlighting configuration for Python
- Handling editor state across component re-renders

## Accomplishments that we're proud of

**🎯 It Actually Works!**
Running a full Python interpreter in the browser, instrumenting it for tracing, inferring data structures, and visualizing them in real-time - this seemed ambitious at the start. Seeing it all come together and actually help people understand code is incredibly rewarding.

**🧠 The Intelligence Layer**
Our data structure detection is surprisingly accurate. Watching it correctly identify a complex recursive tree algorithm or a graph traversal feels like magic.

**⚡ Performance**
Despite running Python in WebAssembly, parsing ASTs, tracking every variable change, and rendering complex visualizations, Trasee stays smooth and responsive.

**🎨 User Experience**
We sweated the details:

- Smooth playback controls with keyboard shortcuts
- Highlighting changed variables between steps
- Draggable visualizations that remember your layout
- Clean, intuitive interface that doesn't overwhelm

**🚀 Zero-Setup Experience**
No installation, no backend, no sign-up. Just visit the site and start tracing code. This accessibility is huge for students and learners.

**📚 Built-In Examples**
We included a curated library of LeetCode problems and algorithms so users can immediately see what Trasee can do.

## What we learned

**Technical Lessons:**

- **WebAssembly is Production-Ready** - Pyodide's performance exceeded our expectations. The future of web apps is running native code in the browser.
- **Web Workers are Essential** - For any CPU-intensive task, Web Workers are non-negotiable. They kept our UI buttery smooth.
- **Type Safety Saves Time** - TypeScript caught so many bugs before runtime. The upfront investment paid off massively.
- **Heuristics > ML for Fast Inference** - Sometimes simple pattern matching beats fancy AI, especially when speed matters.

**Design Lessons:**

- **Progressive Disclosure** - We learned to hide complexity. Power users can dig deep, but beginners see a simple interface.
- **Examples are Documentation** - Good examples teach better than paragraphs of text. Our examples library is the best onboarding.
- **Responsiveness Matters** - Even a 100ms delay feels sluggish when stepping through code. We optimized relentlessly.

**Project Management:**

- **Start with the Core Loop** - We built the end-to-end tracing pipeline first, then added features. This prevented scope creep.
- **Iterate on Real Use Cases** - Testing with actual LeetCode problems revealed UI issues we'd never have imagined.

## What's next for Trasee

We're just getting started! Here's our roadmap:

**🧠 Smarter Data Structure Detection**

Currently, our heuristic-based approach relies on specific attribute names (`.next`, `.left`, `.right`, etc.) to detect data structures. This works great for standard implementations, but breaks when users define custom classes with different names like `.nxt`, `.link`, or `.child1`.

- **LLM-Powered Inference** - Use local WebLLM to analyze object relationships and infer data structures regardless of attribute naming
- **Pattern Learning** - Learn from user corrections: "This is actually a linked list" → remember similar patterns
- **Configurable Detection** - Let users define custom detection rules: "If a class has `.nxt`, treat it as a linked list"
- **Multi-Structure Detection** - Recognize when a single object is part of multiple structures (e.g., a node in both a graph and a tree)

**🎓 Educational Features**

- **Explanation Generation** - Use local WebLLM to generate natural language explanations: _"Created node 7 and linked it to curr.next"_
- **Step Annotations** - Let users add notes to specific execution steps
- **Quiz Mode** - Pause execution and ask: "What will the next step do?"
- **Guided Walkthroughs** - Curriculum-based algorithm lessons with Trasee visualizations

**🔍 More Data Structures**

- Weighted graphs
- Heaps (min-heap, max-heap visualizations)
- Tries (prefix tree rendering)
- Segment trees
- Disjoint set (Union-Find) with tree visualization
- Matrix visualizations with heatmaps

**⚙️ Advanced Debugging**

- **Breakpoints** - Pause execution at specific lines
- **Conditional Breakpoints** - Stop when a variable reaches a value
- **Watch Expressions** - Track custom Python expressions
- **Memory Profiling** - Show object memory usage over time

**🤝 Collaboration Features**

- **Share Traces** - Generate URLs with embedded execution state
- **Annotations & Comments** - Discuss specific steps with others
- **Playlist of Examples** - Curated learning paths for different topics

**🌍 Language Support**

- **JavaScript/TypeScript** - Using a similar tracing approach
- **Java** - Via GraalVM WebAssembly compilation
- **C++** - Would be challenging but incredibly valuable

**🎨 Customization**

- **Theme Editor** - Let users customize visualization colors
- **Layout Algorithms** - Choose between different graph layout strategies
- **Export Options** - Save visualizations as images or GIFs

**📊 Analytics Dashboard**

- Track which examples are most popular
- Identify common patterns in user code
- Surface frequently visualized data structures

**Our Vision:**
We want Trasee to become the go-to tool for anyone learning algorithms and data structures. Whether you're a student tackling your first CS course, a professional preparing for interviews, or a teacher explaining concepts, Trasee should make complex code understandable.

**The ultimate goal:** Make code comprehension as natural as reading a story, with visualizations that adapt to what you're trying to understand.
