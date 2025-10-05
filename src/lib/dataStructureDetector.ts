import { Variable } from "@/store/executionStore";

export type DataStructureType =
  | "num"
  | "string"
  | "boolean"
  | "list"
  | "dict"
  | "linked_list"
  | "tree"
  | "graph"
  | "stack"
  | "queue"
  | "unknown";

export interface DetectedStructure {
  variable: Variable;
  structureType: DataStructureType;
  visualization: any; // Structure-specific visualization data
}

export function detectDataStructure(variable: Variable): DataStructureType {
  const { value, type } = variable;

  // Primitives
  if (type === "int" || type === "float") {
    return "num";
  }

  if (type === "str") {
    return "string";
  }

  if (type === "bool") {
    return "boolean";
  }

  if (type === "list") {
    return "list";
  }

  if (type === "dict") {
    // Check if it's an adjacency list (graph)
    if (isAdjacencyList(value)) {
      return "graph";
    }
    return "dict";
  }

  // Custom objects
  if (value && typeof value === "object" && value.__class__) {
    const className = value.__class__.toLowerCase();

    // Check for linked list patterns
    if (className.includes("node") || className.includes("list")) {
      if (value.__attrs__ && "next" in value.__attrs__) {
        return "linked_list";
      }
    }

    // Check for tree patterns
    if (className.includes("tree") || className.includes("node")) {
      const attrs = value.__attrs__ || {};
      if (("left" in attrs && "right" in attrs) || "children" in attrs) {
        return "tree";
      }
    }
  }

  return "unknown";
}

function isAdjacencyList(value: any): boolean {
  if (!value || typeof value !== "object") return false;

  // Check if it's a dict where values are lists
  const entries = Object.entries(value);
  if (entries.length === 0) return false;

  let listCount = 0;
  for (const [_, val] of entries) {
    if (Array.isArray(val)) {
      listCount++;
    }
  }

  return listCount / entries.length > 0.7; // 70% of values are lists
}

export function prepareVisualizationData(
  variable: Variable,
  structureType: DataStructureType
): any {
  const { value } = variable;

  switch (structureType) {
    case "linked_list":
      return prepareLinkedListData(value);
    case "tree":
      return prepareTreeData(value);
    case "graph":
      return prepareGraphData(value);
    case "list":
      return prepareListData(value);
    case "dict":
      return prepareDictData(value);
    default:
      return { type: structureType, value };
  }
}

function prepareLinkedListData(value: any) {
  const nodes: Array<{ id: string; value: any }> = [];
  let current = value;
  let index = 0;
  const visited = new Set();

  while (current && typeof current === "object" && current.__attrs__) {
    const nodeId = `node_${index}`;

    // Detect cycles
    const nodeStr = JSON.stringify(current);
    if (visited.has(nodeStr)) {
      nodes.push({ id: nodeId, value: "(cycle detected)" });
      break;
    }
    visited.add(nodeStr);

    // Get the value attribute (could be 'val', 'value', 'data', etc.)
    const nodeValue =
      current.__attrs__.val ??
      current.__attrs__.value ??
      current.__attrs__.data ??
      index;

    nodes.push({
      id: nodeId,
      value: nodeValue,
    });

    current = current.__attrs__.next;
    index++;

    if (index > 100) break; // Safety limit
  }

  return { type: "linked_list", nodes };
}

function prepareTreeData(value: any) {
  const buildTree = (node: any, id: string = "root"): any => {
    if (!node || typeof node !== "object" || !node.__attrs__) {
      return null;
    }

    const nodeValue =
      node.__attrs__.val ?? node.__attrs__.value ?? node.__attrs__.data ?? "?";

    const treeNode: any = {
      id,
      value: nodeValue,
      children: [],
    };

    // Binary tree - preserve left/right information
    if ("left" in node.__attrs__ || "right" in node.__attrs__) {
      treeNode.isBinaryTree = true;
      treeNode.left = null;
      treeNode.right = null;

      if (node.__attrs__.left) {
        const leftChild = buildTree(node.__attrs__.left, `${id}_L`);
        if (leftChild) {
          treeNode.left = leftChild;
          treeNode.children.push(leftChild);
        }
      }
      if (node.__attrs__.right) {
        const rightChild = buildTree(node.__attrs__.right, `${id}_R`);
        if (rightChild) {
          treeNode.right = rightChild;
          treeNode.children.push(rightChild);
        }
      }
    }
    // N-ary tree
    else if ("children" in node.__attrs__) {
      const children = node.__attrs__.children;
      if (Array.isArray(children)) {
        children.forEach((child: any, idx: number) => {
          const childNode = buildTree(child, `${id}_${idx}`);
          if (childNode) treeNode.children.push(childNode);
        });
      }
    }

    return treeNode;
  };

  return { type: "tree", root: buildTree(value) };
}

function prepareGraphData(value: any) {
  if (!value || typeof value !== "object") {
    return { type: "graph", nodes: [], edges: [] };
  }

  const nodes: Array<{ id: string; label: string }> = [];
  const edges: Array<{ from: string; to: string }> = [];

  for (const [node, neighbors] of Object.entries(value)) {
    nodes.push({ id: String(node), label: String(node) });

    if (Array.isArray(neighbors)) {
      neighbors.forEach((neighbor: any) => {
        edges.push({ from: String(node), to: String(neighbor) });
      });
    }
  }

  return { type: "graph", nodes, edges };
}

function prepareListData(value: any) {
  if (!Array.isArray(value)) {
    return { type: "list", items: [] };
  }

  return {
    type: "list",
    items: value.map((item, idx) => ({
      index: idx,
      value: item,
    })),
  };
}

function prepareDictData(value: any) {
  if (!value || typeof value !== "object") {
    return { type: "dict", entries: [] };
  }

  return {
    type: "dict",
    entries: Object.entries(value).map(([key, val]) => ({
      key,
      value: val,
    })),
  };
}
