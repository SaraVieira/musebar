export const BOARD_NODE_TYPES = [
	"note",
	"todo",
	"text",
	"frame",
	"file",
	"image",
	"bookmark",
	"embed",
	"map",
	"model",
	"pdf",
] as const;

export type BoardNodeType = (typeof BOARD_NODE_TYPES)[number];

export interface NodeTypeMeta {
	size: { w: number; h: number };
	fill: string;
}

export const NODE_TYPE_META: Record<BoardNodeType, NodeTypeMeta> = {
	note: { size: { w: 240, h: 160 }, fill: "#facc15" },
	todo: { size: { w: 260, h: 200 }, fill: "#38bdf8" },
	text: { size: { w: 200, h: 40 }, fill: "#e2e8f0" },
	frame: { size: { w: 400, h: 300 }, fill: "#1e293b" },
	file: { size: { w: 240, h: 96 }, fill: "#a78bfa" },
	image: { size: { w: 240, h: 180 }, fill: "#fb7185" },
	bookmark: { size: { w: 280, h: 220 }, fill: "#34d399" },
	embed: { size: { w: 480, h: 270 }, fill: "#f97316" },
	map: { size: { w: 320, h: 300 }, fill: "#ef4444" },
	model: { size: { w: 360, h: 300 }, fill: "#8b5cf6" },
	pdf: { size: { w: 360, h: 460 }, fill: "#f87171" },
};

const FALLBACK_SIZE = { w: 200, h: 120 };
const FALLBACK_FILL = "#64748b";

function metaFor(type: string | undefined): NodeTypeMeta | undefined {
	return type ? NODE_TYPE_META[type as BoardNodeType] : undefined;
}

export function nodeDefaultSize(type: string | undefined): {
	w: number;
	h: number;
} {
	return metaFor(type)?.size ?? FALLBACK_SIZE;
}

export function nodeThumbnailFill(type: string | undefined): string {
	return metaFor(type)?.fill ?? FALLBACK_FILL;
}

export const CREATABLE_NODES = [
	{ type: "note", label: "Note", shortcut: "n" },
	{ type: "todo", label: "Todo list", shortcut: "t" },
	{ type: "text", label: "Text", shortcut: "x" },
	{ type: "frame", label: "Frame", shortcut: "f" },
] as const satisfies ReadonlyArray<{
	type: BoardNodeType;
	label: string;
	shortcut: string;
}>;

export type CreatableNodeType = (typeof CREATABLE_NODES)[number]["type"];
