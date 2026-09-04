import { describe, expect, it } from "vitest";
import { validateBoard } from "./schema";

const goodNode = {
	id: "n1",
	type: "note",
	position: { x: 1, y: 2 },
	data: {},
};
const goodEdge = { id: "e1", source: "n1", target: "n2" };

function noteWithLink(href: unknown) {
	return {
		...goodNode,
		data: {
			content: {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: "click",
								marks: [{ type: "link", attrs: { href } }],
							},
						],
					},
				],
			},
		},
	};
}

function marksOf(node: { data?: unknown }) {
	const data = node.data as {
		content?: { content?: Array<{ content?: Array<{ marks?: unknown[] }> }> };
	};
	return data.content?.content?.[0]?.content?.[0]?.marks ?? [];
}

describe("validateBoard", () => {
	it("keeps well-formed nodes and edges", () => {
		const r = validateBoard([goodNode], [goodEdge]);
		expect(r.nodes).toHaveLength(1);
		expect(r.edges).toHaveLength(1);
		expect(r.dropped).toEqual({ nodes: 0, edges: 0 });
	});

	it("passes unknown node fields through untouched", () => {
		const r = validateBoard(
			[{ ...goodNode, width: 240, dragHandle: ".x", zIndex: 3 }],
			[],
		);
		expect(r.nodes[0]).toMatchObject({
			width: 240,
			dragHandle: ".x",
			zIndex: 3,
		});
	});

	it("drops only the malformed entries, not the whole board", () => {
		const r = validateBoard(
			[goodNode, { id: "bad" }, { position: { x: 0, y: 0 } }, null],
			[goodEdge, { id: "e2" }, "nope"],
		);
		expect(r.nodes.map((n) => n.id)).toEqual(["n1"]);
		expect(r.edges.map((e) => e.id)).toEqual(["e1"]);
		expect(r.dropped).toEqual({ nodes: 3, edges: 2 });
	});

	it("rejects a node whose position is not numeric", () => {
		const r = validateBoard([{ ...goodNode, position: { x: "1", y: 2 } }], []);
		expect(r.nodes).toHaveLength(0);
	});

	it("tolerates non-array input", () => {
		expect(validateBoard(null, undefined).nodes).toEqual([]);
		expect(validateBoard("nodes", 42).edges).toEqual([]);
	});
});

describe("validateBoard — link sanitisation", () => {
	it("keeps safe link protocols", () => {
		for (const href of [
			"https://example.com",
			"http://example.com",
			"mailto:a@b.com",
			"/relative/path",
		]) {
			const r = validateBoard([noteWithLink(href)], []);
			expect(marksOf(r.nodes[0]), href).toHaveLength(1);
		}
	});

	it("strips javascript: links, which would otherwise render as live html", () => {
		const r = validateBoard([noteWithLink("javascript:alert(1)")], []);
		expect(marksOf(r.nodes[0])).toHaveLength(0);
	});

	it("strips other dangerous protocols", () => {
		for (const href of [
			"data:text/html,<script>alert(1)</script>",
			"vbscript:msgbox(1)",
			"file:///etc/passwd",
		]) {
			const r = validateBoard([noteWithLink(href)], []);
			expect(marksOf(r.nodes[0]), href).toHaveLength(0);
		}
	});

	it("strips a link mark with a missing or non-string href", () => {
		expect(
			marksOf(validateBoard([noteWithLink(undefined)], []).nodes[0]),
		).toHaveLength(0);
		expect(
			marksOf(validateBoard([noteWithLink(42)], []).nodes[0]),
		).toHaveLength(0);
	});

	it("leaves non-link marks alone", () => {
		const node = {
			...goodNode,
			data: {
				content: {
					type: "doc",
					content: [
						{
							type: "paragraph",
							content: [
								{ type: "text", text: "hi", marks: [{ type: "bold" }] },
							],
						},
					],
				},
			},
		};
		expect(marksOf(validateBoard([node], []).nodes[0])).toHaveLength(1);
	});

	it("sanitises links nested deep in the document", () => {
		const node = {
			...goodNode,
			data: {
				content: {
					type: "doc",
					content: [
						{
							type: "bulletList",
							content: [
								{
									type: "listItem",
									content: [
										{
											type: "paragraph",
											content: [
												{
													type: "text",
													text: "x",
													marks: [
														{ type: "link", attrs: { href: "javascript:1" } },
													],
												},
											],
										},
									],
								},
							],
						},
					],
				},
			},
		};
		const out = validateBoard([node], []).nodes[0];
		expect(JSON.stringify(out)).not.toContain("javascript:");
	});

	it("leaves nodes without rich text untouched", () => {
		const r = validateBoard(
			[{ ...goodNode, type: "image", data: { src: "/api/assets/1" } }],
			[],
		);
		expect(r.nodes[0].data).toEqual({ src: "/api/assets/1" });
	});
});
