import { describe, expect, it } from "vitest";
import { nodeAriaLabel } from "./node-label";
import { BOARD_NODE_TYPES } from "./node-types";
import { parseSnapshot } from "./snapshot";
import { BOARD_TEMPLATES } from "./templates";
import { generateBoardThumbnail } from "./thumbnail";

const buildable = BOARD_TEMPLATES.filter((t) => t.build !== null);

describe("board templates", () => {
	it("offers a blank option that builds nothing", () => {
		const blank = BOARD_TEMPLATES.find((t) => t.key === "blank");
		expect(blank?.build).toBeNull();
	});

	it("gives every template a unique key, name and description", () => {
		const keys = BOARD_TEMPLATES.map((t) => t.key);
		expect(new Set(keys).size).toBe(keys.length);
		for (const t of BOARD_TEMPLATES) {
			expect(t.name.length, t.key).toBeGreaterThan(0);
			expect(t.description.length, t.key).toBeGreaterThan(0);
		}
	});

	it.each(
		buildable.map((t) => [t.key, t] as const),
	)("%s survives the real load path", (key, template) => {
		// parseSnapshot is what actually runs when a board opens, including
		// zod validation — a template that fails it would open empty.
		const parsed = parseSnapshot(template.build?.() ?? null);
		expect(parsed.nodes.length, key).toBeGreaterThan(0);
		expect(parsed.settings).toBeDefined();
	});

	it.each(
		buildable.map((t) => [t.key, t] as const),
	)("%s uses only registered node types", (key, template) => {
		for (const node of parseSnapshot(template.build?.() ?? null).nodes) {
			expect(BOARD_NODE_TYPES, `${key}: ${node.type}`).toContain(node.type);
		}
	});

	it.each(
		buildable.map((t) => [t.key, t] as const),
	)("%s has unique node ids", (key, template) => {
		const ids = parseSnapshot(template.build?.() ?? null).nodes.map(
			(n) => n.id,
		);
		expect(new Set(ids).size, key).toBe(ids.length);
	});

	it.each(
		buildable.map((t) => [t.key, t] as const),
	)("%s has no dangling edges", (key, template) => {
		const { nodes, edges } = parseSnapshot(template.build?.() ?? null);
		const ids = new Set(nodes.map((n) => n.id));
		for (const e of edges) {
			expect(ids.has(e.source), `${key}: source ${e.source}`).toBe(true);
			expect(ids.has(e.target), `${key}: target ${e.target}`).toBe(true);
		}
	});

	it.each(
		buildable.map((t) => [t.key, t] as const),
	)("%s references no uploaded assets", (key, template) => {
		// Templates ship without files, so an asset URL would be a dead link.
		expect(template.build?.(), key).not.toContain("/api/assets/");
	});

	it.each(
		buildable.map((t) => [t.key, t] as const),
	)("%s produces nodes that announce themselves", (key, template) => {
		for (const node of parseSnapshot(template.build?.() ?? null).nodes) {
			expect(nodeAriaLabel(node), `${key}: ${node.type}`).not.toMatch(/^Node/);
		}
	});

	it.each(
		buildable.map((t) => [t.key, t] as const),
	)("%s renders a dashboard thumbnail", (key, template) => {
		// A template that produced a null thumbnail would show as "Empty board".
		const { nodes, edges } = parseSnapshot(template.build?.() ?? null);
		const svg = generateBoardThumbnail(nodes, edges);
		expect(svg, key).toBeTruthy();
		expect(svg, key).toContain("<svg");
		expect(svg, key).not.toContain("NaN");
	});

	it("builds fresh ids on every call, so two boards never collide", () => {
		const template = buildable[0];
		const first = parseSnapshot(template.build?.() ?? null).nodes.map(
			(n) => n.id,
		);
		const second = parseSnapshot(template.build?.() ?? null).nodes.map(
			(n) => n.id,
		);
		expect(first.some((id) => second.includes(id))).toBe(false);
	});
});
