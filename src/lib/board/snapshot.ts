import type { Edge, Node } from "@xyflow/react";
import { validateBoard } from "#/lib/board/schema";
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
			const { nodes, edges } = validateBoard(parsed.nodes, parsed.edges);
			return {
				nodes: nodes
					.filter((n) => !(n.data as { uploading?: unknown })?.uploading)
					.map((n) =>
						n.type === "embed" && !n.dragHandle
							? { ...n, dragHandle: ".embed-drag-handle" }
							: n,
					),
				edges,
				settings: normalizeSettings(parsed.settings),
			};
		}
	} catch {}
	return empty;
}
