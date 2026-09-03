import { describe, expect, it } from "vitest";
import {
	detectEmbed,
	detectFileKind,
	detectModelFormat,
	detectUrlKind,
	isGoogleMapsUrl,
	isImageUrl,
	isPdfUrl,
} from "./detect";

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

describe("detectModelFormat", () => {
	it("recognises every supported extension", () => {
		for (const ext of ["gltf", "glb", "stl", "obj", "3mf"]) {
			expect(detectModelFormat(`model.${ext}`)).toBe(ext);
		}
	});

	it("is case-insensitive", () => {
		expect(detectModelFormat("Model.GLB")).toBe("glb");
	});

	it("uses the last extension on multi-dotted names", () => {
		expect(detectModelFormat("my.model.v2.stl")).toBe("stl");
	});

	it("returns null for unsupported or missing extensions", () => {
		expect(detectModelFormat("photo.png")).toBeNull();
		expect(detectModelFormat("README")).toBeNull();
		expect(detectModelFormat("")).toBeNull();
	});
});

describe("detectUrlKind", () => {
	it("routes each url to its node type", () => {
		expect(detectUrlKind("https://maps.app.goo.gl/abc")).toBe("map");
		expect(detectUrlKind("https://example.com/a.png")).toBe("image");
		expect(detectUrlKind("https://example.com/a.pdf")).toBe("pdf");
		expect(detectUrlKind("https://youtu.be/dQw4w9WgXcQ")).toBe("embed");
		expect(detectUrlKind("https://example.com/article")).toBe("bookmark");
	});

	it("falls back to bookmark for anything unrecognised", () => {
		expect(detectUrlKind("not a url")).toBe("bookmark");
		expect(detectUrlKind("")).toBe("bookmark");
	});

	it("prefers a map over a matching file extension", () => {
		// Order matters: a maps link that happens to end in .png is still a map.
		expect(detectUrlKind("https://www.google.com/maps/place/x.png")).toBe(
			"map",
		);
	});
});

describe("detectFileKind", () => {
	it("routes each file to its node type", () => {
		expect(detectFileKind("scene.glb", "application/octet-stream")).toBe(
			"model",
		);
		expect(detectFileKind("doc.pdf", "application/pdf")).toBe("pdf");
		expect(detectFileKind("pic.png", "image/png")).toBe("image");
		expect(detectFileKind("notes.txt", "text/plain")).toBe("file");
	});

	it("detects a pdf by extension when the mime type is unhelpful", () => {
		expect(detectFileKind("doc.pdf", "application/octet-stream")).toBe("pdf");
	});

	it("prefers a model over its mime type", () => {
		expect(detectFileKind("scene.gltf", "image/png")).toBe("model");
	});

	it("falls back to a plain file card", () => {
		expect(detectFileKind("archive", "")).toBe("file");
	});
});
