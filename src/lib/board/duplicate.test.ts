import type { Edge, Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { duplicateNodes } from "./duplicate";

function node(id: string, extra: Partial<Node> = {}): Node {
	return {
		id,
		type: "note",
		position: { x: 100, y: 100 },
		data: {},
		...extra,
	} as Node;
}

describe("duplicateNodes", () => {
	it("gives every clone a fresh id", () => {
		const { nodes } = duplicateNodes([node("a"), node("b")]);
		const ids = nodes.map((n) => n.id);
		expect(ids).toHaveLength(2);
		expect(new Set(ids).size).toBe(2);
		expect(ids).not.toContain("a");
		expect(ids).not.toContain("b");
	});

	it("offsets top-level clones so they do not sit under the original", () => {
		const { nodes } = duplicateNodes([node("a")]);
		expect(nodes[0].position).toEqual({ x: 124, y: 124 });
	});

	it("keeps a child's position when its parent is duplicated too", () => {
		const parent = node("p", { type: "frame" });
		const child = node("c", { parentId: "p" });
		const { nodes } = duplicateNodes([parent, child]);
		const clonedChild = nodes.find((n) => n.parentId !== undefined);
		expect(clonedChild?.position).toEqual({ x: 100, y: 100 });
	});

	it("repoints a duplicated child at the duplicated parent", () => {
		const { nodes } = duplicateNodes([
			node("p", { type: "frame" }),
			node("c", { parentId: "p" }),
		]);
		const [clonedParent, clonedChild] = nodes;
		expect(clonedChild.parentId).toBe(clonedParent.id);
		expect(clonedChild.parentId).not.toBe("p");
	});

	it("drops a dangling parentId when the parent is not in the selection", () => {
		const { nodes } = duplicateNodes([node("c", { parentId: "not-selected" })]);
		expect(nodes[0].parentId).toBeUndefined();
		expect(nodes[0].position).toEqual({ x: 124, y: 124 });
	});

	it("marks clones selected", () => {
		const { nodes } = duplicateNodes([node("a", { selected: false })]);
		expect(nodes[0].selected).toBe(true);
	});

	it("deep-clones data so edits do not leak back to the original", () => {
		const original = node("a", { data: { items: [{ text: "hi" }] } });
		const { nodes } = duplicateNodes([original]);
		const clonedData = nodes[0].data as { items: Array<{ text: string }> };
		clonedData.items[0].text = "changed";
		expect((original.data as typeof clonedData).items[0].text).toBe("hi");
	});

	it("rewires edges whose endpoints were both duplicated", () => {
		const edges: Edge[] = [{ id: "e1", source: "a", target: "b" }];
		const result = duplicateNodes([node("a"), node("b")], edges);
		expect(result.edges).toHaveLength(1);
		const [clonedA, clonedB] = result.nodes;
		expect(result.edges[0].source).toBe(clonedA.id);
		expect(result.edges[0].target).toBe(clonedB.id);
		expect(result.edges[0].id).not.toBe("e1");
	});

	it("drops edges that point outside the selection", () => {
		const edges: Edge[] = [
			{ id: "e1", source: "a", target: "elsewhere" },
			{ id: "e2", source: "elsewhere", target: "a" },
		];
		expect(duplicateNodes([node("a")], edges).edges).toEqual([]);
	});

	it("handles an empty selection", () => {
		expect(duplicateNodes([])).toEqual({ nodes: [], edges: [] });
	});
});
