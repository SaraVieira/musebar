import type { Node } from "@xyflow/react";
import { useCallback } from "react";
import { toast } from "sonner";
import { detectFileKind, detectModelFormat } from "#/lib/board/detect";
import {
	makeFileNode,
	makeImageNode,
	makeModelNode,
	makePdfNode,
} from "#/lib/board/factories";
import { readImageDims } from "#/lib/media-dims";

type SetNodes = (updater: (nodes: Node[]) => Node[]) => void;
type UploadFile = (file: File) => Promise<{
	id: string;
	src: string;
	mimeType: string;
}>;
type XY = { x: number; y: number };

const DEFAULT_IMAGE_DIMS = { w: 240, h: 180 };

export function useAddFiles(setNodes: SetNodes, uploadFile: UploadFile) {
	return useCallback(
		async (files: File[], at: XY) => {
			const toAdd: Node[] = [];
			for (const [index, file] of files.entries()) {
				try {
					const uploaded = await uploadFile(file);
					switch (detectFileKind(file.name, uploaded.mimeType)) {
						case "model": {
							const format = detectModelFormat(file.name);
							if (format) {
								toAdd.push(makeModelNode(at, index, file, uploaded, format));
							}
							break;
						}
						case "pdf":
							toAdd.push(makePdfNode(at, index, file, uploaded));
							break;
						case "image": {
							const dims = await readImageDims(file).catch(
								() => DEFAULT_IMAGE_DIMS,
							);
							toAdd.push(makeImageNode(at, index, file, uploaded, dims));
							break;
						}
						case "file":
							toAdd.push(makeFileNode(at, index, file, uploaded));
							break;
					}
				} catch (err) {
					toast.error(`Couldn't upload ${file.name}`, {
						description: err instanceof Error ? err.message : undefined,
					});
				}
			}
			if (toAdd.length > 0) setNodes((ns) => [...ns, ...toAdd]);
		},
		[setNodes, uploadFile],
	);
}
