import type { BookmarkNode } from "#/components/board/nodes/bookmark-node";
import {
	EMBED_DRAG_HANDLE_CLASS,
	type EmbedNode,
} from "#/components/board/nodes/embed-node";
import type { FileNode } from "#/components/board/nodes/file-node";
import type { FrameNode } from "#/components/board/nodes/frame-node";
import type { ImageNode } from "#/components/board/nodes/image-node";
import type { MapNode } from "#/components/board/nodes/map-node";
import {
	MODEL_DRAG_HANDLE_CLASS,
	type ModelFormat,
	type ModelNode,
} from "#/components/board/nodes/model-node";
import type { NoteNode } from "#/components/board/nodes/note";
import {
	PDF_DRAG_HANDLE_CLASS,
	type PdfNode,
} from "#/components/board/nodes/pdf-node";
import type { TextNode } from "#/components/board/nodes/text-node";
import type { TodoNode } from "#/components/board/nodes/todo-node";

import { type CreatableNodeType, NODE_TYPE_META } from "#/lib/board/node-types";

type XY = { x: number; y: number };

function makeNoteNode(center: XY): NoteNode {
	const { w, h } = NODE_TYPE_META.note.size;
	return {
		id: crypto.randomUUID(),
		type: "note",
		position: { x: center.x - w / 2, y: center.y - h / 2 },
		width: w,
		height: h,
		data: {},
	};
}

function makeTodoNode(center: XY): TodoNode {
	const { w, h } = NODE_TYPE_META.todo.size;
	return {
		id: crypto.randomUUID(),
		type: "todo",
		position: { x: center.x - w / 2, y: center.y - h / 2 },
		width: w,
		height: h,
		data: { items: [{ id: crypto.randomUUID(), text: "", done: false }] },
	};
}

function makeTextNode(center: XY): TextNode {
	const { w, h } = NODE_TYPE_META.text.size;
	return {
		id: crypto.randomUUID(),
		type: "text",
		position: { x: center.x - w / 2, y: center.y - h / 2 },
		width: w,
		height: h,
		data: {},
	};
}

function makeFrameNode(center: XY): FrameNode {
	const { w, h } = NODE_TYPE_META.frame.size;
	return {
		id: crypto.randomUUID(),
		type: "frame",
		position: { x: center.x - w / 2, y: center.y - h / 2 },
		width: w,
		height: h,
		data: {},
		selectable: true,
		draggable: true,
	};
}

export function makeEmbedNode(
	url: string,
	center: XY,
	embed: { src: string; w: number; h: number },
): EmbedNode {
	return {
		id: crypto.randomUUID(),
		type: "embed",
		position: { x: center.x - embed.w / 2, y: center.y - embed.h / 2 },
		width: embed.w,
		height: embed.h,
		dragHandle: `.${EMBED_DRAG_HANDLE_CLASS}`,
		data: { src: embed.src, title: url },
	};
}

export function makeMapNode(
	center: XY,
	meta: { url: string; mapSrc: string; title: string; address: string },
): MapNode {
	const { w, h } = NODE_TYPE_META.map.size;
	return {
		id: crypto.randomUUID(),
		type: "map",
		position: { x: center.x - w / 2, y: center.y - h / 2 },
		width: w,
		height: h,
		data: {
			url: meta.url,
			mapSrc: meta.mapSrc,
			title: meta.title,
			address: meta.address,
		},
	};
}

export function makeBookmarkNode(
	url: string,
	center: XY,
	meta: {
		title: string;
		description: string;
		image: string;
		favicon: string;
	},
): BookmarkNode {
	const { w, h } = NODE_TYPE_META.bookmark.size;
	return {
		id: crypto.randomUUID(),
		type: "bookmark",
		position: { x: center.x - w / 2, y: center.y - h / 2 },
		width: w,
		height: h,
		data: {
			url,
			title: meta.title,
			description: meta.description,
			image: meta.image,
			favicon: meta.favicon,
		},
	};
}

export function makeImageNode(
	center: XY,
	offsetIndex: number,
	file: { name: string },
	uploaded: { src: string; mimeType: string },
	dims: { w: number; h: number },
): ImageNode {
	const scale = Math.min(1, 320 / Math.max(dims.w, dims.h));
	const w = Math.round(dims.w * scale);
	const h = Math.round(dims.h * scale);
	const offset = offsetIndex * 16;
	return {
		id: crypto.randomUUID(),
		type: "image",
		position: { x: center.x - w / 2 + offset, y: center.y - h / 2 + offset },
		width: w,
		height: h,
		data: { src: uploaded.src, name: file.name, mimeType: uploaded.mimeType },
	};
}

export function makeImageNodeFromUrl(
	center: XY,
	url: string,
	dims: { w: number; h: number },
): ImageNode {
	const scale = Math.min(1, 320 / Math.max(dims.w, dims.h));
	const w = Math.round(dims.w * scale);
	const h = Math.round(dims.h * scale);
	const name = (() => {
		try {
			return decodeURIComponent(new URL(url).pathname.split("/").pop() ?? url);
		} catch {
			return url;
		}
	})();
	const mimeType = (() => {
		const ext = name.split(".").pop()?.toLowerCase();
		const map: Record<string, string> = {
			png: "image/png",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			gif: "image/gif",
			webp: "image/webp",
			svg: "image/svg+xml",
			avif: "image/avif",
			bmp: "image/bmp",
			ico: "image/x-icon",
		};
		return (ext && map[ext]) || "image/*";
	})();
	return {
		id: crypto.randomUUID(),
		type: "image",
		position: { x: center.x - w / 2, y: center.y - h / 2 },
		width: w,
		height: h,
		data: { src: url, name, mimeType },
	};
}

export function makeModelNode(
	center: XY,
	offsetIndex: number,
	file: { name: string },
	uploaded: { src: string; mimeType: string },
	format: ModelFormat,
): ModelNode {
	const { w, h } = NODE_TYPE_META.model.size;
	const offset = offsetIndex * 16;
	return {
		id: crypto.randomUUID(),
		type: "model",
		position: { x: center.x - w / 2 + offset, y: center.y - h / 2 + offset },
		width: w,
		height: h,
		dragHandle: `.${MODEL_DRAG_HANDLE_CLASS}`,
		data: {
			src: uploaded.src,
			name: file.name,
			mimeType: uploaded.mimeType || "application/octet-stream",
			format,
		},
	};
}

export function makePdfNode(
	center: XY,
	offsetIndex: number,
	file: { name: string; size?: number },
	uploaded: { src: string },
): PdfNode {
	const { w, h } = NODE_TYPE_META.pdf.size;
	const offset = offsetIndex * 16;
	return {
		id: crypto.randomUUID(),
		type: "pdf",
		position: { x: center.x - w / 2 + offset, y: center.y - h / 2 + offset },
		width: w,
		height: h,
		dragHandle: `.${PDF_DRAG_HANDLE_CLASS}`,
		data: {
			src: uploaded.src,
			name: file.name,
			size: file.size,
		},
	};
}

export function makePdfNodeFromUrl(center: XY, url: string): PdfNode {
	const { w, h } = NODE_TYPE_META.pdf.size;
	const name = (() => {
		try {
			return decodeURIComponent(new URL(url).pathname.split("/").pop() ?? url);
		} catch {
			return url;
		}
	})();
	return {
		id: crypto.randomUUID(),
		type: "pdf",
		position: { x: center.x - w / 2, y: center.y - h / 2 },
		width: w,
		height: h,
		dragHandle: `.${PDF_DRAG_HANDLE_CLASS}`,
		data: { src: url, name },
	};
}

export function makeFileNode(
	center: XY,
	offsetIndex: number,
	file: { name: string; size: number },
	uploaded: { src: string; mimeType: string },
): FileNode {
	const { w, h } = NODE_TYPE_META.file.size;
	const offset = offsetIndex * 16;
	return {
		id: crypto.randomUUID(),
		type: "file",
		position: { x: center.x - w / 2 + offset, y: center.y - h / 2 + offset },
		width: w,
		height: h,
		data: {
			src: uploaded.src,
			name: file.name,
			mimeType: uploaded.mimeType || "application/octet-stream",
			size: file.size,
		},
	};
}

/**
 * Builds a node of one of the directly-creatable types. Keeps callers from
 * having to fan out to a specific factory per type.
 */
export function makeCreatableNode(type: CreatableNodeType, center: XY) {
	switch (type) {
		case "note":
			return makeNoteNode(center);
		case "todo":
			return makeTodoNode(center);
		case "text":
			return makeTextNode(center);
		case "frame":
			return makeFrameNode(center);
	}
}
