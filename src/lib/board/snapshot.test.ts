import { describe, expect, it } from "vitest";
import { DEFAULT_BOARD_SETTINGS } from "./settings";
import { parseSnapshot } from "./snapshot";

const EMPTY = { nodes: [], edges: [], settings: DEFAULT_BOARD_SETTINGS };

describe("parseSnapshot", () => {
	it("returns an empty board for null or empty content", () => {
		expect(parseSnapshot(null)).toEqual(EMPTY);
		expect(parseSnapshot("")).toEqual(EMPTY);
	});

	it("returns an empty board rather than throwing on malformed JSON", () => {
		expect(parseSnapshot("{not json")).toEqual(EMPTY);
		expect(parseSnapshot("null")).toEqual(EMPTY);
	});

	it("returns an empty board when nodes/edges are not arrays", () => {
		expect(parseSnapshot(JSON.stringify({ nodes: {}, edges: [] }))).toEqual(
			EMPTY,
		);
		expect(parseSnapshot(JSON.stringify({ nodes: [], edges: "x" }))).toEqual(
			EMPTY,
		);
		expect(parseSnapshot(JSON.stringify({ nodes: [] }))).toEqual(EMPTY);
	});

	it("round-trips nodes, edges and settings", () => {
		const raw = JSON.stringify({
			nodes: [{ id: "a", type: "note", position: { x: 1, y: 2 }, data: {} }],
			edges: [{ id: "e1", source: "a", target: "b" }],
			settings: { gridSize: 40, minimap: false },
		});
		const result = parseSnapshot(raw);
		expect(result.nodes).toHaveLength(1);
		expect(result.nodes[0].id).toBe("a");
		expect(result.edges[0].id).toBe("e1");
		expect(result.settings.gridSize).toBe(40);
		expect(result.settings.minimap).toBe(false);
	});

	it("normalizes bad settings instead of rejecting the whole board", () => {
		const raw = JSON.stringify({
			nodes: [],
			edges: [],
			settings: { gridSize: -1 },
		});
		expect(parseSnapshot(raw).settings).toEqual(DEFAULT_BOARD_SETTINGS);
	});

	it("drops nodes that were still uploading when the board was saved", () => {
		const raw = JSON.stringify({
			nodes: [
				{
					id: "done",
					type: "image",
					position: { x: 0, y: 0 },
					data: { src: "/api/assets/1", uploading: false },
				},
				{
					id: "midflight",
					type: "image",
					position: { x: 0, y: 0 },
					data: { src: "", uploading: true, progress: 0.4 },
				},
			],
			edges: [],
		});
		const result = parseSnapshot(raw);
		expect(result.nodes).toHaveLength(1);
		expect(result.nodes[0].id).toBe("done");
	});

	it("keeps nodes with no upload flag at all", () => {
		const raw = JSON.stringify({
			nodes: [{ id: "n", type: "note", position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		});
		expect(parseSnapshot(raw).nodes).toHaveLength(1);
	});

	it("backfills the drag handle on legacy embed nodes", () => {
		const raw = JSON.stringify({
			nodes: [{ id: "e", type: "embed", position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		});
		expect(parseSnapshot(raw).nodes[0].dragHandle).toBe(".embed-drag-handle");
	});

	it("leaves an existing embed drag handle alone", () => {
		const raw = JSON.stringify({
			nodes: [
				{
					id: "e",
					type: "embed",
					dragHandle: ".custom",
					position: { x: 0, y: 0 },
					data: {},
				},
			],
			edges: [],
		});
		expect(parseSnapshot(raw).nodes[0].dragHandle).toBe(".custom");
	});

	it("does not add a drag handle to non-embed nodes", () => {
		const raw = JSON.stringify({
			nodes: [{ id: "n", type: "note", position: { x: 0, y: 0 }, data: {} }],
			edges: [],
		});
		expect(parseSnapshot(raw).nodes[0].dragHandle).toBeUndefined();
	});
});
