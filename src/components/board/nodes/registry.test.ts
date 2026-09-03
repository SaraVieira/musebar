import { describe, expect, it } from "vitest";
import {
	BOARD_NODE_TYPES,
	CREATABLE_NODES,
	NODE_TYPE_META,
} from "#/lib/board/node-types";
import { CREATABLE_NODE_ICONS, nodeTypes } from "./registry";

describe("node type registry", () => {
	it("registers a view component for every declared node type", () => {
		for (const type of BOARD_NODE_TYPES) {
			expect(nodeTypes[type], `missing view for "${type}"`).toBeTypeOf(
				"function",
			);
		}
	});

	it("has no view components for undeclared types", () => {
		expect(Object.keys(nodeTypes).sort()).toEqual([...BOARD_NODE_TYPES].sort());
	});

	it("has size and fill metadata for every node type", () => {
		for (const type of BOARD_NODE_TYPES) {
			const meta = NODE_TYPE_META[type];
			expect(meta, `missing meta for "${type}"`).toBeDefined();
			expect(meta.size.w).toBeGreaterThan(0);
			expect(meta.size.h).toBeGreaterThan(0);
			expect(meta.fill).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});

	it("gives every creatable type an icon and a unique shortcut", () => {
		const shortcuts = CREATABLE_NODES.map((n) => n.shortcut);
		expect(new Set(shortcuts).size).toBe(shortcuts.length);
		for (const { type, label, shortcut } of CREATABLE_NODES) {
			expect(CREATABLE_NODE_ICONS[type], `no icon for "${type}"`).toBeDefined();
			expect(label.length).toBeGreaterThan(0);
			expect(shortcut).toMatch(/^[a-z]$/);
		}
	});

	it("only marks declared node types as creatable", () => {
		for (const { type } of CREATABLE_NODES) {
			expect(BOARD_NODE_TYPES).toContain(type);
		}
	});
});
