import {
	addEdge,
	type Connection,
	type Edge,
	type Node,
	type OnConnect,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { BoardSettings } from "#/lib/board/settings";
import { parseSnapshot } from "#/lib/board/snapshot";
import { generateBoardThumbnail } from "#/lib/board/thumbnail";
import { useAutosave } from "#/lib/hooks/use-autosave";
import { readImageDims } from "#/lib/media-dims";
import { type getProject, updateProjectContent } from "#/lib/projects-server";

type Project = NonNullable<Awaited<ReturnType<typeof getProject>>>;

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

export function useBoard(project: Project) {
	// Parsed once, at mount. A later router.invalidate() returning fresh content
	// must not reset the board mid-edit; switching projects remounts this whole
	// tree via the route's remountDeps, which is what re-runs this.
	const [initial] = useState(() => parseSnapshot(project.content));
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initial.nodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);
	const [settings, setSettings] = useState<BoardSettings>(initial.settings);

	const board = useMemo(
		() => ({ nodes, edges, settings }),
		[nodes, edges, settings],
	);

	const saveBoard = useCallback(
		(data: typeof board, version: number) =>
			updateProjectContent({
				data: {
					id: project.id,
					content: JSON.stringify(data),
					thumbnail: generateBoardThumbnail(data.nodes, data.edges),
					expectedVersion: version,
				},
			}),
		[project.id],
	);

	const { status: saveStatus } = useAutosave({
		data: board,
		initialVersion: project.version,
		save: saveBoard,
		onConflict: () => {
			toast.error("This board changed somewhere else", {
				id: "board-save-conflict",
				description:
					"Saving is paused so your changes don't overwrite it. Reload to get the latest version.",
				duration: Number.POSITIVE_INFINITY,
			});
		},
		onError: (err) => {
			toast.error("Couldn't save the board", {
				id: "board-save-error",
				description: err instanceof Error ? err.message : undefined,
			});
		},
	});

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
		saveStatus,
		uploadFile: (file: File) => uploadFile(file, project.id),
		readImageDims,
	};
}
