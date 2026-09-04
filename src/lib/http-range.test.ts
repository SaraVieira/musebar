import { describe, expect, it } from "vitest";
import { parseRangeHeader } from "./http-range";

const SIZE = 1000;

describe("parseRangeHeader", () => {
	it("ignores a missing or unparseable header", () => {
		expect(parseRangeHeader(null, SIZE)).toBeNull();
		expect(parseRangeHeader("", SIZE)).toBeNull();
		expect(parseRangeHeader("items=0-10", SIZE)).toBeNull();
		expect(parseRangeHeader("bytes=abc", SIZE)).toBeNull();
		expect(parseRangeHeader("bytes=-", SIZE)).toBeNull();
	});

	it("parses an explicit range", () => {
		expect(parseRangeHeader("bytes=0-99", SIZE)).toEqual({ start: 0, end: 99 });
		expect(parseRangeHeader("bytes=100-199", SIZE)).toEqual({
			start: 100,
			end: 199,
		});
	});

	it("parses an open-ended range", () => {
		expect(parseRangeHeader("bytes=500-", SIZE)).toEqual({
			start: 500,
			end: 999,
		});
	});

	it("parses a suffix range as the last N bytes", () => {
		expect(parseRangeHeader("bytes=-100", SIZE)).toEqual({
			start: 900,
			end: 999,
		});
	});

	it("clamps a suffix longer than the resource", () => {
		expect(parseRangeHeader("bytes=-5000", SIZE)).toEqual({
			start: 0,
			end: 999,
		});
	});

	it("clamps an end past the last byte", () => {
		expect(parseRangeHeader("bytes=900-99999", SIZE)).toEqual({
			start: 900,
			end: 999,
		});
	});

	it("reports unsatisfiable ranges", () => {
		expect(parseRangeHeader("bytes=1000-", SIZE)).toBe("unsatisfiable");
		expect(parseRangeHeader("bytes=2000-3000", SIZE)).toBe("unsatisfiable");
		expect(parseRangeHeader("bytes=-0", SIZE)).toBe("unsatisfiable");
		expect(parseRangeHeader("bytes=500-100", SIZE)).toBe("unsatisfiable");
	});

	it("treats any range over an empty resource as unsatisfiable", () => {
		expect(parseRangeHeader("bytes=0-10", 0)).toBe("unsatisfiable");
	});

	it("tolerates surrounding whitespace", () => {
		expect(parseRangeHeader("  bytes=0-9  ", SIZE)).toEqual({
			start: 0,
			end: 9,
		});
	});

	it("declines multi-range requests rather than mishandling them", () => {
		expect(parseRangeHeader("bytes=0-9,20-29", SIZE)).toBeNull();
	});

	it("handles a single-byte resource", () => {
		expect(parseRangeHeader("bytes=0-0", 1)).toEqual({ start: 0, end: 0 });
		expect(parseRangeHeader("bytes=1-1", 1)).toBe("unsatisfiable");
	});
});
