import type { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { nodeAriaLabel } from "./node-label";
import { BOARD_NODE_TYPES } from "./node-types";

function node(type: string, data: Record<string, unknown> = {}): Node {
	return { id: "n1", type, position: { x: 0, y: 0 }, data } as Node;
}

function doc(...paragraphs: string[]) {
	return {
		type: "doc",
		content: paragraphs.map((text) => ({
			type: "paragraph",
			content: [{ type: "text", text }],
		})),
	};
}

describe("nodeAriaLabel", () => {
	it("names every declared node type", () => {
		for (const type of BOARD_NODE_TYPES) {
			const label = nodeAriaLabel(node(type));
			expect(label, `no label for "${type}"`).toBeTruthy();
			expect(label).not.toMatch(/^Node/);
		}
	});

	it("falls back for an unknown or missing type", () => {
		expect(nodeAriaLabel(node("mystery"))).toBe("Node, empty");
		expect(
			nodeAriaLabel({ id: "x", position: { x: 0, y: 0 }, data: {} } as Node),
		).toBe("Node, empty");
	});

	it("says a node is empty rather than naming it bare", () => {
		expect(nodeAriaLabel(node("note"))).toBe("Note, empty");
		expect(nodeAriaLabel(node("image"))).toBe("Image, empty");
	});

	it("flattens a note's rich text into the label", () => {
		expect(nodeAriaLabel(node("note", { content: doc("Buy milk") }))).toBe(
			"Note: Buy milk",
		);
		expect(
			nodeAriaLabel(node("note", { content: doc("First", "Second") })),
		).toBe("Note: First Second");
	});

	it("summarises a todo list's progress", () => {
		const items = [
			{ id: "1", text: "a", done: true },
			{ id: "2", text: "b", done: false },
		];
		expect(nodeAriaLabel(node("todo", { title: "Groceries", items }))).toBe(
			"Todo list: Groceries, 1 of 2 done",
		);
		expect(nodeAriaLabel(node("todo", { items: [] }))).toBe("Todo list: empty");
	});

	it("names file-backed nodes by their filename", () => {
		expect(nodeAriaLabel(node("image", { name: "sunset.png" }))).toBe(
			"Image: sunset.png",
		);
		expect(nodeAriaLabel(node("pdf", { name: "spec.pdf" }))).toBe(
			"PDF: spec.pdf",
		);
		expect(nodeAriaLabel(node("model", { name: "chair.glb" }))).toBe(
			"3D model: chair.glb",
		);
	});

	it("prefers a bookmark's title but falls back to its url", () => {
		expect(
			nodeAriaLabel(node("bookmark", { title: "Docs", url: "https://x.dev" })),
		).toBe("Bookmark: Docs");
		expect(nodeAriaLabel(node("bookmark", { url: "https://x.dev" }))).toBe(
			"Bookmark: https://x.dev",
		);
	});

	it("truncates long content", () => {
		const long = "x".repeat(200);
		const label = nodeAriaLabel(node("text", { text: long }));
		expect(label.length).toBeLessThan(100);
		expect(label.endsWith("…")).toBe(true);
	});

	it("ignores malformed data instead of throwing", () => {
		expect(() => nodeAriaLabel(node("note", { content: null }))).not.toThrow();
		expect(() => nodeAriaLabel(node("todo", { items: "nope" }))).not.toThrow();
		expect(nodeAriaLabel(node("text", { text: 42 }))).toBe("Text, empty");
	});
});
