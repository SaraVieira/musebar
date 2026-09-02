import type { Edge, Node } from "@xyflow/react";

const OFFSET = 24;

export function duplicateNodes(
	nodes: Node[],
	edges: Edge[] = [],
): { nodes: Node[]; edges: Edge[] } {
	const idMap = new Map<string, string>();
	for (const n of nodes) {
		idMap.set(n.id, crypto.randomUUID());
	}

	const clonedNodes = nodes.map((n) => {
		const newId = idMap.get(n.id) ?? crypto.randomUUID();
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

	const clonedEdges = edges.flatMap((e) => {
		const source = idMap.get(e.source);
		const target = idMap.get(e.target);
		if (!source || !target) return [];
		return [{ ...e, id: crypto.randomUUID(), source, target, selected: true }];
	});

	return { nodes: clonedNodes, edges: clonedEdges };
}
