import { useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { ControlPanel } from "@/components/ControlPanel";
import { VisualizationPanel } from "@/components/VisualizationPanel";
import { VariablesPanel } from "@/components/VariablesPanel";

const DEFAULT_CODE = `# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def addTwoNumbers(l1: ListNode, l2: ListNode) -> ListNode:
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

# Test the function
l1 = ListNode(2, ListNode(4, ListNode(3)))
l2 = ListNode(5, ListNode(6, ListNode(4)))
result = addTwoNumbers(l1, l2)
`;

const Index = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    // Placeholder for execution logic
    setTimeout(() => setIsRunning(false), 1000);
  };

  const handleStepForward = () => {
    // Placeholder
  };

  const handleStepBack = () => {
    // Placeholder
  };

  const handleReset = () => {
    setCode(DEFAULT_CODE);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ControlPanel
        onRun={handleRun}
        onStepForward={handleStepForward}
        onStepBack={handleStepBack}
        onReset={handleReset}
        isRunning={isRunning}
        canStepBack={false}
        canStepForward={false}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Code Editor */}
        <div className="w-1/2 p-4 border-r border-border">
          <CodeEditor value={code} onChange={(value) => setCode(value || "")} />
        </div>
        
        {/* Right Panel - Visualization */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1">
            <VisualizationPanel />
          </div>
          <div className="h-64 border-t border-border p-4">
            <VariablesPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
