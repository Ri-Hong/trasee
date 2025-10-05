import { useState } from "react";
import { BookOpen, Code2, TreePine, Link2, Hash, Grid3x3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Example {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  dataStructures: string[];
  code: string;
  icon: React.ElementType;
}

const EXAMPLES: Example[] = [
  {
    id: "add_two_numbers",
    title: "Add Two Numbers (Linked List)",
    description:
      "Add two numbers represented by linked lists, where each node contains a single digit.",
    difficulty: "Medium",
    dataStructures: ["Linked List"],
    icon: Link2,
    code: `# Definition for singly-linked list.
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
`,
  },
  {
    id: "path_sum_ii",
    title: "Path Sum II (DFS)",
    description:
      "Find all root-to-leaf paths where the sum equals a target using DFS and backtracking.",
    difficulty: "Medium",
    dataStructures: ["Binary Tree"],
    icon: TreePine,
    code: `# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def pathSum(root: TreeNode, targetSum: int) -> list[list[int]]:
    result = []
    current_path = []
    
    def dfs(node, remaining):
        if not node:
            return
        
        # Add current node to path
        current_path.append(node.val)
        
        # Check if it's a leaf and sum matches
        if not node.left and not node.right and remaining == node.val:
            result.append(current_path.copy())
        
        # Explore left and right subtrees
        dfs(node.left, remaining - node.val)
        dfs(node.right, remaining - node.val)
        
        # Backtrack: remove current node from path
        current_path.pop()
    
    dfs(root, targetSum)
    return result

# Test the function - Build tree top-down to see each node added
#       5
#      / \\
#     4   8
#    /   / \\
#   11  13  4
#  /  \\      \\
# 7    2      1

# Build tree from root down - each assignment adds one visible node
root = TreeNode(5)

# Add level 2: children of root
root.left = TreeNode(4)
root.right = TreeNode(8)

# Add level 3: children of node 4 and node 8
root.left.left = TreeNode(11)
root.right.left = TreeNode(13)
root.right.right = TreeNode(4)

# Add level 4: children of the deepest nodes
root.left.left.left = TreeNode(7)
root.left.left.right = TreeNode(2)
root.right.right.right = TreeNode(1)

target = 22
result = pathSum(root, target)
print(f"Paths with sum {target}: {result}")
`,
  },
  {
    id: "two_sum",
    title: "Two Sum",
    description:
      "Find two numbers in an array that add up to a target sum using a hash map.",
    difficulty: "Easy",
    dataStructures: ["Array", "Hash Map"],
    icon: Hash,
    code: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    
    for i in range(len(nums)):
        num = nums[i]
        complement = target - num
        
        if complement in seen:
            return [seen[complement], i]
        
        seen[num] = i
    
    return []

# Test the function
nums = [2, 7, 11, 15]
target = 13
result = twoSum(nums, target)
print(f"Indices: {result}")
`,
  },
  {
    id: "valid_parentheses",
    title: "Valid Parentheses",
    description: "Check if a string of parentheses is valid using a stack.",
    difficulty: "Easy",
    dataStructures: ["Stack"],
    icon: Code2,
    code: `def isValid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    
    for char in s:
        if char in mapping:
            # Closing bracket
            if not stack:
                return False
            
            top = stack.pop()
            if mapping[char] != top:
                return False
        else:
            # Opening bracket
            stack.append(char)
    
    return len(stack) == 0

# Test the function
test1 = "()"
test2 = "()[]{}"
test3 = "(]"
test4 = "([)]"
test5 = "{[]}"

print(f"'{test1}' is valid: {isValid(test1)}")
print(f"'{test2}' is valid: {isValid(test2)}")
print(f"'{test3}' is valid: {isValid(test3)}")
print(f"'{test4}' is valid: {isValid(test4)}")
print(f"'{test5}' is valid: {isValid(test5)}")
`,
  },
  {
    id: "max_depth_binary_tree",
    title: "Maximum Depth of Binary Tree",
    description: "Find the maximum depth of a binary tree using recursion.",
    difficulty: "Easy",
    dataStructures: ["Binary Tree"],
    icon: TreePine,
    code: `# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def maxDepth(root: TreeNode) -> int:
    if not root:
        return 0
    
    left_depth = maxDepth(root.left)
    right_depth = maxDepth(root.right)
    
    return max(left_depth, right_depth) + 1

# Test the function
#     3
#   /   \\
#  9     20
#       /  \\
#      15   7
root = TreeNode(3)
root.left = TreeNode(9)
root.right = TreeNode(20, TreeNode(15), TreeNode(7))
result = maxDepth(root)
print(f"Maximum depth: {result}")
`,
  },
  {
    id: "merge_two_sorted_lists",
    title: "Merge Two Sorted Lists",
    description: "Merge two sorted linked lists into one sorted list.",
    difficulty: "Easy",
    dataStructures: ["Linked List"],
    icon: Link2,
    code: `# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def mergeTwoLists(l1: ListNode, l2: ListNode) -> ListNode:
    dummy = ListNode()
    current = dummy
    
    while l1 and l2:
        if l1.val <= l2.val:
            current.next = l1
            l1 = l1.next
        else:
            current.next = l2
            l2 = l2.next
        current = current.next
    
    # Attach remaining nodes
    if l1:
        current.next = l1
    if l2:
        current.next = l2
    
    return dummy.next

# Test the function
l1 = ListNode(1, ListNode(2, ListNode(4)))
l2 = ListNode(1, ListNode(3, ListNode(4)))
result = mergeTwoLists(l1, l2)
`,
  },
  {
    id: "spiral_matrix",
    title: "Spiral Matrix",
    description: "Return all elements of a matrix in spiral order.",
    difficulty: "Medium",
    dataStructures: ["Matrix", "Array"],
    icon: Grid3x3,
    code: `def spiralOrder(matrix: list[list[int]]) -> list[int]:
    if not matrix or not matrix[0]:
        return []
    
    result = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    
    while top <= bottom and left <= right:
        # Traverse right
        for col in range(left, right + 1):
            result.append(matrix[top][col])
        top += 1
        
        # Traverse down
        for row in range(top, bottom + 1):
            result.append(matrix[row][right])
        right -= 1
        
        # Traverse left (if still valid)
        if top <= bottom:
            for col in range(right, left - 1, -1):
                result.append(matrix[bottom][col])
            bottom -= 1
        
        # Traverse up (if still valid)
        if left <= right:
            for row in range(bottom, top - 1, -1):
                result.append(matrix[row][left])
            left += 1
    
    return result

# Test the function
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]
result = spiralOrder(matrix)
print(f"Spiral order: {result}")
`,
  },
];

interface ExamplesLibraryProps {
  onSelectExample: (code: string) => void;
}

export function ExamplesLibrary({ onSelectExample }: ExamplesLibraryProps) {
  const [open, setOpen] = useState(false);

  const handleSelectExample = (example: Example) => {
    onSelectExample(example.code);
    setOpen(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "Hard":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="w-4 h-4 mt-[2px]" />
          Examples
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Examples Library</DialogTitle>
            <DialogDescription>
              Choose an example to load into the editor and start visualizing
            </DialogDescription>
          </DialogHeader>
        </div>
        <ScrollArea className="flex-1 px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0 pr-4 pb-6">
            {EXAMPLES.map((example) => {
              const Icon = example.icon;
              return (
                <Card
                  key={example.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelectExample(example)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-tight">
                            {example.title}
                          </CardTitle>
                          <Badge
                            variant="secondary"
                            className={getDifficultyColor(example.difficulty)}
                          >
                            {example.difficulty}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {example.description}
                        </CardDescription>
                        <div className="flex flex-wrap gap-1">
                          {example.dataStructures.map((ds) => (
                            <Badge
                              key={ds}
                              variant="outline"
                              className="text-xs"
                            >
                              {ds}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
