import type { Edge, Node } from "@xyflow/react";
import { DEFAULT_BOARD_SETTINGS } from "#/lib/board/settings";

// Starter boards. Deliberately asset-free: a template with images would need
// its files embedded, and these are meant to be small and instant.

type XY = { x: number; y: number };

function id() {
	return crypto.randomUUID();
}

function doc(...lines: string[]) {
	return {
		type: "doc",
		content: lines.map((text) =>
			text
				? { type: "paragraph", content: [{ type: "text", text }] }
				: { type: "paragraph" },
		),
	};
}

function note(at: XY, color: string, ...lines: string[]): Node {
	return {
		id: id(),
		type: "note",
		position: at,
		width: 240,
		height: 160,
		data: { content: doc(...lines), color },
	};
}

function text(at: XY, value: string, size = 24): Node {
	return {
		id: id(),
		type: "text",
		position: at,
		width: 320,
		height: size * 1.6,
		data: { text: value, size },
	};
}

function frame(at: XY, title: string, width = 400, height = 420): Node {
	return {
		id: id(),
		type: "frame",
		position: at,
		width,
		height,
		data: { title },
		selectable: true,
		draggable: true,
	};
}

function todo(at: XY, title: string, items: string[], color?: string): Node {
	return {
		id: id(),
		type: "todo",
		position: at,
		width: 300,
		height: 240,
		data: {
			title,
			color,
			items: items.map((t) => ({ id: id(), text: t, done: false })),
		},
	};
}

function edge(source: string, target: string): Edge {
	return { id: id(), source, target };
}

function board(nodes: Node[], edges: Edge[] = []) {
	return JSON.stringify({ nodes, edges, settings: DEFAULT_BOARD_SETTINGS });
}

export interface BoardTemplate {
	key: string;
	name: string;
	description: string;
	/** Null for a blank board, so the picker can offer "start empty". */
	build: (() => string) | null;
}

export const BOARD_TEMPLATES: readonly BoardTemplate[] = [
	{
		key: "blank",
		name: "Blank",
		description: "An empty canvas.",
		build: null,
	},
	{
		key: "moodboard",
		name: "Moodboard",
		description: "Framed sections for imagery, palette and type.",
		build: () =>
			board([
				text({ x: 0, y: -80 }, "Moodboard", 32),
				frame({ x: 0, y: 0 }, "Direction"),
				note(
					{ x: 40, y: 60 },
					"#ffe58a",
					"What is this for?",
					"",
					"Drop images and links straight onto the canvas.",
				),
				frame({ x: 460, y: 0 }, "Palette"),
				note(
					{ x: 500, y: 60 },
					"#a8f0d0",
					"Colours",
					"",
					"Paste hex values or drop swatches here.",
				),
				frame({ x: 920, y: 0 }, "Type & texture"),
				note(
					{ x: 960, y: 60 },
					"#c9a8ff",
					"Typography",
					"",
					"Screenshots of type you like.",
				),
			]),
	},
	{
		key: "project",
		name: "Project plan",
		description: "To do, doing and done, with a place for notes.",
		build: () =>
			board([
				text({ x: 0, y: -80 }, "Project plan", 32),
				frame({ x: 0, y: 0 }, "To do", 360, 320),
				todo({ x: 30, y: 60 }, "Backlog", [
					"Write the brief",
					"Collect references",
					"Draft the first pass",
				]),
				frame({ x: 420, y: 0 }, "Doing", 360, 320),
				todo({ x: 450, y: 60 }, "In progress", ["Pick one thing"], "#9ec8ff"),
				frame({ x: 840, y: 0 }, "Done", 360, 320),
				todo({ x: 870, y: 60 }, "Shipped", [], "#a8f0d0"),
				note(
					{ x: 0, y: 380 },
					"#ffffff",
					"Notes",
					"",
					"Decisions, links and anything that does not fit a task.",
				),
			]),
	},
	{
		key: "brainstorm",
		name: "Brainstorm",
		description: "A central idea with branches radiating from it.",
		build: () => {
			const centre = note(
				{ x: 400, y: 240 },
				"#ffffff",
				"The idea",
				"",
				"Start here.",
			);
			const branches = [
				note({ x: 40, y: 40 }, "#ffe58a", "Why?"),
				note({ x: 760, y: 40 }, "#a8f0d0", "Who is it for?"),
				note({ x: 40, y: 440 }, "#9ec8ff", "What exists already?"),
				note({ x: 760, y: 440 }, "#ffb3d1", "What could go wrong?"),
			];
			return board(
				[centre, ...branches],
				branches.map((b) => edge(centre.id, b.id)),
			);
		},
	},
	{
		key: "retro",
		name: "Retro",
		description: "What went well, what didn't, and what to change.",
		build: () =>
			board([
				text({ x: 0, y: -80 }, "Retro", 32),
				frame({ x: 0, y: 0 }, "Went well", 360, 320),
				todo({ x: 30, y: 60 }, "Keep doing", [""], "#a8f0d0"),
				frame({ x: 420, y: 0 }, "Didn't go well", 360, 320),
				todo({ x: 450, y: 60 }, "Stop doing", [""], "#ffb3d1"),
				frame({ x: 840, y: 0 }, "Actions", 360, 320),
				todo({ x: 870, y: 60 }, "Try next", [""], "#9ec8ff"),
			]),
	},
];
