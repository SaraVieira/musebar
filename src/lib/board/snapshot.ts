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
				// A node still marked `uploading` was saved mid-upload, so its asset
				// never landed. Restoring it would show a permanent progress bar over
				// a file that does not exist.
				nodes: parsed.nodes
					.filter((n: Node) => !(n.data as { uploading?: unknown })?.uploading)
					.map((n: Node) =>
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
