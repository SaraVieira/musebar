import { describe, expect, it } from "vitest";
import { isGoogleMapsUrl, isImageUrl, isPdfUrl } from "./use-add-by-url";

describe("isImageUrl", () => {
	it("matches known image extensions", () => {
		for (const ext of [
			"png",
			"jpg",
			"jpeg",
			"gif",
			"webp",
			"svg",
			"avif",
			"bmp",
			"ico",
		]) {
			expect(isImageUrl(`https://example.com/pic.${ext}`)).toBe(true);
		}
	});

	it("is case-insensitive", () => {
		expect(isImageUrl("https://example.com/PIC.PNG")).toBe(true);
	});

	it("ignores query strings and fragments after the extension", () => {
		expect(isImageUrl("https://example.com/a.png?v=2")).toBe(true);
		expect(isImageUrl("https://example.com/a.png#top")).toBe(true);
	});

	it("does not match an extension that only appears in the query", () => {
		expect(isImageUrl("https://example.com/view?file=a.png")).toBe(false);
	});

	it("rejects non-images and unparseable input", () => {
		expect(isImageUrl("https://example.com/page")).toBe(false);
		expect(isImageUrl("https://example.com/archive.zip")).toBe(false);
		expect(isImageUrl("not a url")).toBe(false);
	});
});

describe("isPdfUrl", () => {
	it("matches .pdf paths, with or without a query", () => {
		expect(isPdfUrl("https://example.com/doc.pdf")).toBe(true);
		expect(isPdfUrl("https://example.com/doc.PDF?dl=1")).toBe(true);
	});

	it("rejects everything else", () => {
		expect(isPdfUrl("https://example.com/doc.png")).toBe(false);
		expect(isPdfUrl("https://example.com/pdf")).toBe(false);
		expect(isPdfUrl("nonsense")).toBe(false);
	});
});

describe("isGoogleMapsUrl", () => {
	it("matches the Google Maps hosts and paths", () => {
		expect(isGoogleMapsUrl("https://maps.google.com/?q=lisbon")).toBe(true);
		expect(isGoogleMapsUrl("https://maps.app.goo.gl/abc123")).toBe(true);
		expect(isGoogleMapsUrl("https://goo.gl/maps/abc")).toBe(true);
		expect(isGoogleMapsUrl("https://www.google.com/maps/place/Lisbon")).toBe(
			true,
		);
		expect(isGoogleMapsUrl("https://google.com/maps")).toBe(true);
	});

	it("is case-insensitive on the host", () => {
		expect(isGoogleMapsUrl("https://MAPS.GOOGLE.COM/?q=x")).toBe(true);
	});

	it("rejects other Google paths and lookalike hosts", () => {
		expect(isGoogleMapsUrl("https://www.google.com/search?q=maps")).toBe(false);
		expect(isGoogleMapsUrl("https://goo.gl/abc")).toBe(false);
		expect(isGoogleMapsUrl("https://notgoogle.com/maps")).toBe(false);
		expect(isGoogleMapsUrl("maps.google.com")).toBe(false);
	});
});
