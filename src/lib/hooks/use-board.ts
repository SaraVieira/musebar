import {
	addEdge,
	type Connection,
	type Edge,
	type Node,
	type OnConnect,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	type BoardSettings,
	DEFAULT_BOARD_SETTINGS,
	normalizeSettings,
} from "#/lib/board/settings";
import { generateBoardThumbnail } from "#/lib/board/thumbnail";
import { readImageDims } from "#/lib/media-dims";
import { type getProject, updateProjectContent } from "#/lib/projects-server";

type Project = NonNullable<Awaited<ReturnType<typeof getProject>>>;

const SAVE_DEBOUNCE_MS = 800;

async function uploadFile(file: File, projectId: string) {
	const form = new FormData();
	form.set("file", file);
	form.set("projectId", projectId);
	const res = await fetch("/api/uploads", { method: "POST", body: form });
	if (!res.ok) {
		throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
	}
	return (await res.json()) as { id: string; src: string; mimeType: string };
}

function parseSnapshot(raw: string | null): {
	nodes: Node[];
	edges: Edge[];
	settings: BoardSettings;
} {
	const empty = {
		nodes: [] as Node[],
		edges: [] as Edge[],
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

export function useBoard(project: Project) {
	// Parsed once per project on purpose. Depending on project.content would
	// re-parse and discard in-progress edits every time an autosave-triggered
	// router.invalidate() returns fresh content.
	// biome-ignore lint/correctness/useExhaustiveDependencies: initial value, keyed by project
	const initial = useMemo(() => parseSnapshot(project.content), [project.id]);
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initial.nodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);
	const [settings, setSettings] = useState<BoardSettings>(initial.settings);
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const skipNextSave = useRef(true);

	useEffect(() => {
		if (skipNextSave.current) {
			skipNextSave.current = false;
			return;
		}
		if (saveTimer.current) clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => {
			updateProjectContent({
				data: {
					id: project.id,
					content: JSON.stringify({ nodes, edges, settings }),
					thumbnail: generateBoardThumbnail(nodes, edges),
				},
			}).catch((err) => {
				toast.error("Couldn't save the board", {
					id: "board-save-error",
					description: err instanceof Error ? err.message : undefined,
				});
			});
		}, SAVE_DEBOUNCE_MS);
		return () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
		};
	}, [nodes, edges, settings, project.id]);

	const onConnect: OnConnect = useCallback(
		(params: Connection) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	const updateSettings = useCallback(
		(patch: Partial<BoardSettings>) => setSettings((s) => ({ ...s, ...patch })),
		[],
	);

	return {
		nodes,
		edges,
		setNodes,
		setEdges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		settings,
		updateSettings,
		uploadFile: (file: File) => uploadFile(file, project.id),
		readImageDims,
	};
}
