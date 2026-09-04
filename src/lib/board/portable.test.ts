import { describe, expect, it } from "vitest";
import {
	exportFilename,
	PORTABLE_ARCHIVE_FORMAT,
	PORTABLE_BOARD_FORMAT,
	parseImport,
	rewriteAssetReferences,
} from "./portable";

const board = {
	format: PORTABLE_BOARD_FORMAT,
	version: 1,
	name: "My board",
	description: null,
	content: '{"nodes":[],"edges":[]}',
	assets: [],
};

describe("parseImport", () => {
	it("accepts a single exported board", () => {
		const r = parseImport(board);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.boards).toHaveLength(1);
	});

	it("accepts an archive of several boards", () => {
		const r = parseImport({
			format: PORTABLE_ARCHIVE_FORMAT,
			version: 1,
			boards: [board, { ...board, name: "Second" }],
		});
		expect(r.ok).toBe(true);
		if (r.ok)
			expect(r.boards.map((b) => b.name)).toEqual(["My board", "Second"]);
	});

	it("defaults assets to an empty list", () => {
		const { assets, ...withoutAssets } = board;
		const r = parseImport(withoutAssets);
		expect(r.ok && r.boards[0].assets).toEqual([]);
	});

	it("rejects anything that is not a Musebar export", () => {
		for (const input of [null, 42, "x", {}, { format: "something-else" }]) {
			const r = parseImport(input);
			expect(r.ok, JSON.stringify(input)).toBe(false);
			if (!r.ok) expect(r.error).toBe("Not a Musebar export.");
		}
	});

	it("rejects a file from a newer version rather than guessing", () => {
		const r = parseImport({ ...board, version: 99 });
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/newer version/);
	});

	it("rejects a board with no name", () => {
		expect(parseImport({ ...board, name: "" }).ok).toBe(false);
	});

	it("rejects a board whose content is not a string", () => {
		expect(parseImport({ ...board, content: { nodes: [] } }).ok).toBe(false);
	});

	it("carries assets through", () => {
		const r = parseImport({
			...board,
			assets: [{ id: "a1", name: "x.png", mimeType: "image/png", data: "AAA" }],
		});
		expect(r.ok && r.boards[0].assets[0].id).toBe("a1");
	});
});

describe("rewriteAssetReferences", () => {
	it("rewrites mapped ids", () => {
		const out = rewriteAssetReferences(
			'{"src":"/api/assets/old-1","other":"/api/assets/old-2"}',
			new Map([
				["old-1", "new-1"],
				["old-2", "new-2"],
			]),
		);
		expect(out).toBe('{"src":"/api/assets/new-1","other":"/api/assets/new-2"}');
	});

	it("leaves unmapped references alone rather than corrupting them", () => {
		const content = '{"src":"/api/assets/unknown"}';
		expect(rewriteAssetReferences(content, new Map([["a", "b"]]))).toBe(
			content,
		);
	});

	it("is a no-op for an empty map", () => {
		const content = '{"src":"/api/assets/x"}';
		expect(rewriteAssetReferences(content, new Map())).toBe(content);
	});

	it("rewrites every occurrence of a repeated id", () => {
		const out = rewriteAssetReferences(
			"/api/assets/a and /api/assets/a",
			new Map([["a", "b"]]),
		);
		expect(out).toBe("/api/assets/b and /api/assets/b");
	});

	it("does not touch text that merely looks similar", () => {
		const content = "/api/uploads/a /api/assetsx/a";
		expect(rewriteAssetReferences(content, new Map([["a", "b"]]))).toBe(
			content,
		);
	});
});

describe("exportFilename", () => {
	it("slugifies the board name", () => {
		expect(exportFilename("My Board!", "json")).toBe("my-board.json");
		expect(exportFilename("  spaced  out  ", "json")).toBe("spaced-out.json");
	});

	it("falls back when a name has nothing usable", () => {
		expect(exportFilename("!!!", "json")).toBe("board.json");
		expect(exportFilename("", "json")).toBe("board.json");
	});
});
