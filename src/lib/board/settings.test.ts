import { describe, expect, it } from "vitest";
import { DEFAULT_BOARD_SETTINGS, normalizeSettings } from "./settings";

describe("normalizeSettings", () => {
	it("falls back to defaults for non-objects", () => {
		expect(normalizeSettings(null)).toEqual(DEFAULT_BOARD_SETTINGS);
		expect(normalizeSettings(undefined)).toEqual(DEFAULT_BOARD_SETTINGS);
		expect(normalizeSettings("dots")).toEqual(DEFAULT_BOARD_SETTINGS);
		expect(normalizeSettings(42)).toEqual(DEFAULT_BOARD_SETTINGS);
	});

	it("keeps valid values", () => {
		const input = {
			snap: true,
			gridSize: 40,
			bgVariant: "cross" as const,
			bgColor: "#ff0000",
			minimap: false,
		};
		expect(normalizeSettings(input)).toEqual(input);
	});

	it("replaces individually invalid fields without discarding the rest", () => {
		const result = normalizeSettings({
			snap: "yes",
			gridSize: 40,
			bgVariant: "spirals",
			minimap: false,
		});
		expect(result.gridSize).toBe(40);
		expect(result.minimap).toBe(false);
		expect(result.snap).toBe(DEFAULT_BOARD_SETTINGS.snap);
		expect(result.bgVariant).toBe(DEFAULT_BOARD_SETTINGS.bgVariant);
	});

	it("rejects non-positive grid sizes", () => {
		expect(normalizeSettings({ gridSize: 0 }).gridSize).toBe(
			DEFAULT_BOARD_SETTINGS.gridSize,
		);
		expect(normalizeSettings({ gridSize: -10 }).gridSize).toBe(
			DEFAULT_BOARD_SETTINGS.gridSize,
		);
	});

	it("accepts every documented background variant", () => {
		for (const v of ["dots", "lines", "cross", "none"] as const) {
			expect(normalizeSettings({ bgVariant: v }).bgVariant).toBe(v);
		}
	});
});
