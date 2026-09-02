import type { Edge, Node } from "@xyflow/react";
import {
	type BoardSettings,
	DEFAULT_BOARD_SETTINGS,
	normalizeSettings,
} from "#/lib/board/settings";

export interface BoardSnapshot {
	nodes: Node[];
	edges: Edge[];
	settings: BoardSettings;
}

export function parseSnapshot(raw: string | null): BoardSnapshot {
	const empty: BoardSnapshot = {
		nodes: [],
		edges: [],
		settings: DEFAULT_BOARD_SETTINGS,
	};
	if (!raw) return empty;
	try {
		const parsed = JSON.parse(raw);
		if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
			return {
				nodes: parsed.nodes.map((n: Node) =>
					n.type === "embed" && !n.dragHandle
						? { ...n, dragHandle: ".embed-drag-handle" }
						: n,
				),
				edges: parsed.edges,
				settings: normalizeSettings(parsed.settings),
			};
		}
	} catch {}
	return empty;
}
