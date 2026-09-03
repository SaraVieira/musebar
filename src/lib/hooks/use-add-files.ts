import type { Node } from "@xyflow/react";
import { useCallback } from "react";
import { toast } from "sonner";
import { detectFileKind } from "#/lib/board/detect";
import { makeUploadPlaceholder } from "#/lib/board/factories";
import { readImageDims } from "#/lib/media-dims";

type SetNodes = (updater: (nodes: Node[]) => Node[]) => void;
type UploadFile = (
	file: File,
	onProgress?: (fraction: number) => void,
) => Promise<{ id: string; src: string; mimeType: string }>;
type XY = { x: number; y: number };

const DEFAULT_IMAGE_DIMS = { w: 240, h: 180 };

export function useAddFiles(setNodes: SetNodes, uploadFile: UploadFile) {
	return useCallback(
		async (files: File[], at: XY) => {
			const patch = (id: string, data: Record<string, unknown>) =>
				setNodes((ns) =>
					ns.map((n) =>
						n.id === id ? { ...n, data: { ...n.data, ...data } } : n,
					),
				);
			const drop = (id: string) =>
				setNodes((ns) => ns.filter((n) => n.id !== id));

			// Every placeholder is placed first, so a multi-file drop is
			// acknowledged in full straight away rather than one node at a time.
			const placeholders = await Promise.all(
				files.map(async (file, index) => {
					const kind = detectFileKind(file.name, file.type);
					// Read dimensions from the local file so an image placeholder is
					// already the right shape and nothing reflows on completion.
					const dims =
						kind === "image"
							? await readImageDims(file).catch(() => DEFAULT_IMAGE_DIMS)
							: undefined;
					return {
						file,
						node: makeUploadPlaceholder(kind, at, index, file, dims),
					};
				}),
			);
			setNodes((ns) => [...ns, ...placeholders.map((p) => p.node)]);

			for (const { file, node } of placeholders) {
				try {
					// Only write when the visible percentage actually changes; the raw
					// progress events fire far more often, and every write is a node
					// state change the autosave has to react to.
					let lastPct = -1;
					const uploaded = await uploadFile(file, (fraction) => {
						const pct = Math.round(fraction * 100);
						if (pct === lastPct) return;
						lastPct = pct;
						patch(node.id, { progress: fraction });
					});
					patch(node.id, {
						src: uploaded.src,
						mimeType: uploaded.mimeType || file.type,
						uploading: false,
						progress: 1,
					});
				} catch (err) {
					drop(node.id);
					toast.error(`Couldn't upload ${file.name}`, {
						description: err instanceof Error ? err.message : undefined,
					});
				}
			}
		},
		[setNodes, uploadFile],
	);
}
