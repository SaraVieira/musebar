import type { Node } from "@xyflow/react";

const OFFSET = 24;

// Return a deep-cloned version of the given nodes with fresh IDs and a
// small positional offset. Preserves parent relationships when the parent
// itself is being duplicated (remaps to the new parent id); otherwise
// detaches the child from its old parent so the clone stays in world space.
export function duplicateNodes(nodes: Node[]): Node[] {
  const idMap = new Map<string, string>();
  nodes.forEach((n) => idMap.set(n.id, crypto.randomUUID()));

  return nodes.map((n) => {
    const newId = idMap.get(n.id)!;
    const newParent = n.parentId ? idMap.get(n.parentId) : undefined;
    return {
      ...n,
      id: newId,
      selected: true,
      parentId: newParent,
      position: {
        x: n.position.x + (newParent ? 0 : OFFSET),
        y: n.position.y + (newParent ? 0 : OFFSET),
      },
      data: structuredClone(n.data),
    };
  });
}
