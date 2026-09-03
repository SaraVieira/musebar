/**
 * Works out which node type a dropped file or pasted URL should become.
 *
 * Detection lives here, separate from the factories that build the nodes, so
 * the rules are a pure ordered table rather than a chain of `if`s spread
 * through the add hooks — and so they can be tested without React.
 */

export type ModelFormat = "gltf" | "glb" | "stl" | "obj" | "3mf";

const MODEL_EXTS = ["gltf", "glb", "stl", "obj", "3mf"] as const;

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(?:$|[?#])/i;
const PDF_EXT_RE = /\.pdf(?:$|[?#])/i;

export function detectModelFormat(name: string): ModelFormat | null {
	const ext = name.split(".").pop()?.toLowerCase();
	if (!ext) return null;
	return (MODEL_EXTS as readonly string[]).includes(ext)
		? (ext as ModelFormat)
		: null;
}

export function detectEmbed(
	url: string,
): { src: string; w: number; h: number } | null {
	const yt = url.match(
		/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
	);
	if (yt)
		return { src: `https://www.youtube.com/embed/${yt[1]}`, w: 480, h: 270 };

	const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
	if (vimeo)
		return {
			src: `https://player.vimeo.com/video/${vimeo[1]}`,
			w: 480,
			h: 270,
		};

	const loom = url.match(/loom\.com\/share\/([\w-]+)/);
	if (loom)
		return { src: `https://www.loom.com/embed/${loom[1]}`, w: 480, h: 270 };

	return null;
}

function pathnameOf(url: string): string | null {
	try {
		return new URL(url).pathname;
	} catch {
		return null;
	}
}

export function isImageUrl(url: string): boolean {
	const path = pathnameOf(url);
	return path !== null && IMAGE_EXT_RE.test(path);
}

export function isPdfUrl(url: string): boolean {
	const path = pathnameOf(url);
	return path !== null && PDF_EXT_RE.test(path);
}

export function isGoogleMapsUrl(url: string): boolean {
	try {
		const u = new URL(url);
		const host = u.hostname.toLowerCase();
		if (host === "maps.google.com" || host === "maps.app.goo.gl") return true;
		if (host === "goo.gl" && u.pathname.startsWith("/maps")) return true;
		if (
			(host === "www.google.com" || host === "google.com") &&
			u.pathname.startsWith("/maps")
		)
			return true;
		return false;
	} catch {
		return false;
	}
}

export type UrlKind = "map" | "image" | "pdf" | "embed" | "bookmark";

/**
 * Ordered: the first match wins, and `bookmark` is the catch-all. Order
 * matters — a Google Maps link ending in `.png` should still be a map.
 */
const URL_RULES: ReadonlyArray<{
	kind: Exclude<UrlKind, "bookmark">;
	matches: (url: string) => boolean;
}> = [
	{ kind: "map", matches: isGoogleMapsUrl },
	{ kind: "image", matches: isImageUrl },
	{ kind: "pdf", matches: isPdfUrl },
	{ kind: "embed", matches: (url) => detectEmbed(url) !== null },
];

export function detectUrlKind(url: string): UrlKind {
	return URL_RULES.find((rule) => rule.matches(url))?.kind ?? "bookmark";
}

export type FileKind = "model" | "pdf" | "image" | "file";

/** Ordered the same way, with `file` as the catch-all. */
export function detectFileKind(name: string, mimeType: string): FileKind {
	if (detectModelFormat(name)) return "model";
	if (mimeType === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
	if (mimeType.startsWith("image/")) return "image";
	return "file";
}
