import { describe, expect, it } from "vitest";
import { detectEmbed } from "./embed-node";

describe("detectEmbed", () => {
	it("recognises the YouTube url shapes", () => {
		const urls = [
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			"https://www.youtube.com/watch?list=x&v=dQw4w9WgXcQ",
			"https://www.youtube.com/embed/dQw4w9WgXcQ",
			"https://www.youtube.com/shorts/dQw4w9WgXcQ",
			"https://youtu.be/dQw4w9WgXcQ",
		];
		for (const url of urls) {
			expect(detectEmbed(url)?.src).toBe(
				"https://www.youtube.com/embed/dQw4w9WgXcQ",
			);
		}
	});

	it("recognises Vimeo urls", () => {
		expect(detectEmbed("https://vimeo.com/123456789")?.src).toBe(
			"https://player.vimeo.com/video/123456789",
		);
		expect(detectEmbed("https://vimeo.com/video/123456789")?.src).toBe(
			"https://player.vimeo.com/video/123456789",
		);
	});

	it("recognises Loom share urls", () => {
		expect(detectEmbed("https://www.loom.com/share/abc-123")?.src).toBe(
			"https://www.loom.com/embed/abc-123",
		);
	});

	it("returns 16:9 default dimensions", () => {
		expect(detectEmbed("https://youtu.be/dQw4w9WgXcQ")).toMatchObject({
			w: 480,
			h: 270,
		});
	});

	it("returns null for anything it does not handle", () => {
		expect(detectEmbed("https://example.com/video")).toBeNull();
		expect(detectEmbed("https://vimeo.com/notanumber")).toBeNull();
		expect(detectEmbed("")).toBeNull();
	});
});
