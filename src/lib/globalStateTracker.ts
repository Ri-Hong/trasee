import { Variable, ExecutionStep } from "@/store/executionStore";
import { DataStructureType } from "./dataStructureDetector";

// Unique identifier for a node within a data structure
export interface NodeIdentity {
  id: string; // Unique ID for this node
  hash: string; // Hash of the node's content for matching
}

// Tracks a data structure's complete state
export interface GlobalDataStructure {
  rootVarName: string; // Original variable name that introduced this structure
  structureType: DataStructureType;
  nodes: Map<string, any>; // Map of node ID to node value
  firstSeenStep: number; // Step when first introduced
}

// Tracks which variables point to which nodes
export interface VariablePointer {
  varName: string;
  structureId: string; // Which global structure this points into
  nodeId: string | null; // Which node within that structure (null if points to null/None)
}

/**
 * Generates a hash for a node based on its content
 * This helps us identify the same node across different variable references
 */
function generateNodeHash(value: any): string {
  if (value === null || value === undefined) return "null";

  if (typeof value === "object" && value.__attrs__) {
    // For linked list nodes, use the value and position in chain
    const nodeVal =
      value.__attrs__.val ?? value.__attrs__.value ?? value.__attrs__.data;
    const nextHash = value.__attrs__.next ? "has_next" : "no_next";
    return `node_${nodeVal}_${nextHash}`;
  }

  return JSON.stringify(value);
}

/**
 * Recursively assigns unique IDs to all nodes in a data structure
 */
function assignNodeIds(
  value: any,
  structureType: DataStructureType,
  nodeMap: Map<string, any>,
  prefix: string = "n",
  visited: Set<any> = new Set()
): string | null {
  if (value === null || value === undefined) return null;

  // Prevent infinite loops
  if (visited.has(value)) return null;
  visited.add(value);

  if (structureType === "linked_list") {
    let current = value;
    let index = 0;

    while (current && typeof current === "object" && current.__attrs__) {
      const nodeId = `${prefix}_${index}`;
      nodeMap.set(nodeId, current);

      current = current.__attrs__.next;
      index++;

      if (index > 100) break; // Safety limit
    }

    return `${prefix}_0`; // Return ID of first node
  }

  if (structureType === "tree") {
    const nodeId = prefix;
    nodeMap.set(nodeId, value);

    if (value.__attrs__) {
      if (value.__attrs__.left) {
        assignNodeIds(
          value.__attrs__.left,
          structureType,
          nodeMap,
          `${prefix}_L`,
          visited
        );
      }
      if (value.__attrs__.right) {
        assignNodeIds(
          value.__attrs__.right,
          structureType,
          nodeMap,
          `${prefix}_R`,
          visited
        );
      }
      if (value.__attrs__.children && Array.isArray(value.__attrs__.children)) {
        value.__attrs__.children.forEach((child: any, idx: number) => {
          assignNodeIds(
            child,
            structureType,
            nodeMap,
            `${prefix}_${idx}`,
            visited
          );
        });
      }
    }

    return nodeId;
  }

  if (structureType === "list") {
    // For arrays, each element gets an index-based ID
    if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        const nodeId = `${prefix}_${idx}`;
        nodeMap.set(nodeId, item);
      });
      return `${prefix}_0`; // Return ID of first element
    }
  }

  return null;
}

/**
 * Finds which node in a global structure a variable currently points to
 * Returns the node ID if found, null otherwise
 */
function findNodeInStructure(
  currentValue: any,
  structureNodes: Map<string, any>
): string | null {
  if (currentValue === null || currentValue === undefined) return null;

  // For objects with __attrs__ (custom Python objects like ListNode)
  if (typeof currentValue === "object" && currentValue.__attrs__) {
    const currVal =
      currentValue.__attrs__.val ??
      currentValue.__attrs__.value ??
      currentValue.__attrs__.data;

    // Try to match based on value and structure position
    for (const [nodeId, nodeValue] of structureNodes.entries()) {
      if (typeof nodeValue === "object" && nodeValue.__attrs__) {
        const nodeVal =
          nodeValue.__attrs__.val ??
          nodeValue.__attrs__.value ??
          nodeValue.__attrs__.data;

        // Match if values are equal
        if (currVal === nodeVal) {
          // For linked lists, also check the next pointer to ensure we have the right node
          // (in case there are duplicate values)
          const currNext = currentValue.__attrs__.next;
          const nodeNext = nodeValue.__attrs__.next;

          // If both are null or both point to same next value, it's a match
          if (!currNext && !nodeNext) return nodeId;

          if (currNext && nodeNext) {
            const currNextVal =
              currNext.__attrs__?.val ??
              currNext.__attrs__?.value ??
              currNext.__attrs__?.data;
            const nodeNextVal =
              nodeNext.__attrs__?.val ??
              nodeNext.__attrs__?.value ??
              nodeNext.__attrs__?.data;
            if (currNextVal === nodeNextVal) return nodeId;
          }
        }
      }
    }
  }

  // For arrays, match by value and index
  if (Array.isArray(currentValue)) {
    for (const [nodeId, nodeValue] of structureNodes.entries()) {
      if (nodeValue === currentValue) return nodeId;
    }
  }

  return null;
}

/**
 * Main function to build global state tracking from execution steps
 */
export function buildGlobalStateTracking(steps: ExecutionStep[]): {
  structures: Map<string, GlobalDataStructure>;
  stepPointers: Map<number, VariablePointer[]>; // Map of step index to variable pointers
} {
  const structures = new Map<string, GlobalDataStructure>();
  const stepPointers = new Map<number, VariablePointer[]>();
  const variableOrigins = new Map<string, string>(); // Track original structure for each variable

  steps.forEach((step, stepIndex) => {
    const pointers: VariablePointer[] = [];

    step.variables.forEach((variable) => {
      const { var_name, value, type } = variable;

      // Skip non-visualizable types
      if (
        !value ||
        [
          "function",
          "type",
          "module",
          "method",
          "builtin_function_or_method",
        ].includes(type)
      ) {
        return;
      }

      // Check if this is a complex data structure
      const isComplexStructure =
        typeof value === "object" && (value.__attrs__ || Array.isArray(value));

      if (!isComplexStructure) return;

      // Determine structure type
      let structureType: DataStructureType = "unknown";
      if (value.__attrs__?.next !== undefined) {
        structureType = "linked_list";
      } else if (
        value.__attrs__?.left !== undefined ||
        value.__attrs__?.right !== undefined
      ) {
        structureType = "tree";
      } else if (Array.isArray(value)) {
        structureType = "list";
      }

      if (structureType === "unknown") return;

      // Check if this variable already belongs to a known structure
      let structureId = variableOrigins.get(var_name);

      // If not, check if it points into any existing structure
      if (!structureId) {
        for (const [existingStructId, existingStruct] of structures.entries()) {
          if (existingStruct.structureType === structureType) {
            const nodeId = findNodeInStructure(value, existingStruct.nodes);
            if (nodeId) {
              structureId = existingStructId;
              variableOrigins.set(var_name, structureId);
              break;
            }
          }
        }
      }

      // If still no structure found, this is a new structure
      if (!structureId) {
        structureId = `struct_${structures.size}_${var_name}`;
        const nodeMap = new Map<string, any>();
        const prefix = `${var_name.charAt(0)}`;
        assignNodeIds(value, structureType, nodeMap, prefix);

        structures.set(structureId, {
          rootVarName: var_name,
          structureType,
          nodes: nodeMap,
          firstSeenStep: stepIndex,
        });

        variableOrigins.set(var_name, structureId);
      }

      // Track pointer for this variable
      const structure = structures.get(structureId);
      if (structure) {
        const nodeId = findNodeInStructure(value, structure.nodes);
        pointers.push({
          varName: var_name,
          structureId,
          nodeId,
        });
      }
    });

    stepPointers.set(stepIndex, pointers);
  });

  return { structures, stepPointers };
}
