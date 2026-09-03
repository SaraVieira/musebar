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

export interface UploadedAsset {
	id: string;
	src: string;
	mimeType: string;
}

function uploadFile(
	file: File,
	projectId: string,
	onProgress?: (fraction: number) => void,
): Promise<UploadedAsset> {
	const form = new FormData();
	form.set("file", file);
	form.set("projectId", projectId);

	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", "/api/uploads");
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onProgress?.(e.loaded / e.total);
		};
		xhr.onload = () => {
			if (xhr.status < 200 || xhr.status >= 300) {
				reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
				return;
			}
			try {
				resolve(JSON.parse(xhr.responseText) as UploadedAsset);
			} catch {
				reject(new Error("Upload returned a malformed response"));
			}
		};
		xhr.onerror = () => reject(new Error("Upload failed: network error"));
		xhr.onabort = () => reject(new Error("Upload cancelled"));
		xhr.send(form);
	});
}

export function useBoard(project: Project) {
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
					// ariaLabel is derived at render time; an undo can round-trip it
					// back into state, so drop it rather than persist a stale copy.
					content: JSON.stringify({
						...data,
						nodes: data.nodes.map(({ ariaLabel: _ariaLabel, ...n }) => n),
					}),
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
		uploadFile: (file: File, onProgress?: (fraction: number) => void) =>
			uploadFile(file, project.id, onProgress),
		readImageDims,
	};
}
