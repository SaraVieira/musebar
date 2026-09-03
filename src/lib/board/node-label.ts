import type { Node } from "@xyflow/react";
import type { BoardNodeType } from "#/lib/board/node-types";

/**
 * Accessible name for a node.
 *
 * React Flow renders each node wrapper as `role="group"`, and a group takes no
 * accessible name from its contents — so without this a node announces only as
 * "node", and an image or 3D model announces nothing useful at all.
 */

const TYPE_LABEL: Record<BoardNodeType, string> = {
	note: "Note",
	todo: "Todo list",
	text: "Text",
	frame: "Frame",
	file: "File",
	image: "Image",
	bookmark: "Bookmark",
	embed: "Embedded media",
	map: "Map",
	model: "3D model",
	pdf: "PDF",
};

const MAX_PREVIEW = 80;

function str(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function truncate(value: string): string {
	return value.length > MAX_PREVIEW
		? `${value.slice(0, MAX_PREVIEW - 1)}…`
		: value;
}

/** Flattens a TipTap doc to its text so a note can announce its content. */
function textFromDoc(doc: unknown): string {
	if (!doc || typeof doc !== "object") return "";
	const node = doc as { text?: unknown; content?: unknown };
	if (typeof node.text === "string") return node.text;
	if (!Array.isArray(node.content)) return "";
	return node.content.map(textFromDoc).filter(Boolean).join(" ");
}

function todoSummary(data: Record<string, unknown>): string {
	const items = Array.isArray(data.items) ? data.items : [];
	if (items.length === 0) return "empty";
	const done = items.filter(
		(i) => (i as { done?: unknown })?.done === true,
	).length;
	return `${done} of ${items.length} done`;
}

function detailFor(type: string, data: Record<string, unknown>): string {
	switch (type) {
		case "note":
			return truncate(textFromDoc(data.content).trim());
		case "text":
			return truncate(str(data.text));
		case "todo":
			return [str(data.title), todoSummary(data)].filter(Boolean).join(", ");
		case "frame":
			return str(data.title);
		case "bookmark":
		case "map":
			return truncate(str(data.title) || str(data.url));
		case "embed":
			return truncate(str(data.title));
		case "image":
		case "file":
		case "pdf":
		case "model":
			return truncate(str(data.name));
		default:
			return "";
	}
}

export function nodeAriaLabel(node: Node): string {
	const type = node.type ?? "";
	const base = TYPE_LABEL[type as BoardNodeType] ?? "Node";
	const data = (node.data ?? {}) as Record<string, unknown>;
	const detail = detailFor(type, data);
	return detail ? `${base}: ${detail}` : `${base}, empty`;
}
