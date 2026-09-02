import type { Edge, Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { generateBoardThumbnail } from "./thumbnail";

function node(id: string, extra: Partial<Node> = {}): Node {
	return {
		id,
		type: "note",
		position: { x: 0, y: 0 },
		data: {},
		...extra,
	} as Node;
}

describe("generateBoardThumbnail", () => {
	it("returns null for an empty board", () => {
		expect(generateBoardThumbnail([], [])).toBeNull();
	});

	it("produces a self-contained svg document", () => {
		const svg = generateBoardThumbnail([node("a")], []);
		expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
		expect(svg?.endsWith("</svg>")).toBe(true);
		expect(svg).toContain('viewBox="0 0 480 300"');
	});

	it("draws one rect per node", () => {
		const svg = generateBoardThumbnail([node("a"), node("b")], []) ?? "";
		// One background rect plus one per node.
		expect(svg.match(/<rect /g)).toHaveLength(3);
	});

	it("draws a line per edge between known nodes", () => {
		const nodes = [node("a"), node("b", { position: { x: 400, y: 400 } })];
		const edges: Edge[] = [{ id: "e", source: "a", target: "b" }];
		const svg = generateBoardThumbnail(nodes, edges) ?? "";
		expect(svg.match(/<line /g)).toHaveLength(1);
	});

	it("skips edges whose endpoints are missing", () => {
		const edges: Edge[] = [{ id: "e", source: "a", target: "ghost" }];
		const svg = generateBoardThumbnail([node("a")], edges) ?? "";
		expect(svg).not.toContain("<line ");
	});

	it("renders frames as dashed outlines rather than filled rects", () => {
		const svg =
			generateBoardThumbnail([node("f", { type: "frame" })], []) ?? "";
		expect(svg).toContain('stroke-dasharray="3 2"');
		expect(svg).toContain('fill="none"');
	});

	it("uses the node's own colour when it has one", () => {
		const svg =
			generateBoardThumbnail([node("a", { data: { color: "#123456" } })], []) ??
			"";
		expect(svg).toContain("#123456");
	});

	it("escapes colour values so they cannot break out of the attribute", () => {
		const svg =
			generateBoardThumbnail(
				[node("a", { data: { color: '"><script>alert(1)</script>' } })],
				[],
			) ?? "";
		expect(svg).not.toContain("<script>");
		expect(svg).toContain("&quot;");
	});

	it("handles a single zero-sized node without producing NaN", () => {
		const svg =
			generateBoardThumbnail([node("a", { width: 0, height: 0 })], []) ?? "";
		expect(svg).not.toContain("NaN");
	});

	it("does not emit NaN for nodes sharing one position", () => {
		const svg = generateBoardThumbnail([node("a"), node("b")], []) ?? "";
		expect(svg).not.toContain("NaN");
	});
});
