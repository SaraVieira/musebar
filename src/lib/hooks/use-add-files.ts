import type { Node } from "@xyflow/react";
import { useCallback } from "react";
import { toast } from "sonner";
import { detectModelFormat } from "#/components/board/nodes/model-node";
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

function isPdf(file: File, mimeType: string) {
	return mimeType === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function useAddFiles(setNodes: SetNodes, uploadFile: UploadFile) {
	return useCallback(
		async (files: File[], at: XY) => {
			const toAdd: Node[] = [];
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				try {
					const uploaded = await uploadFile(file);
					const modelFormat = detectModelFormat(file.name);
					if (modelFormat) {
						toAdd.push(makeModelNode(at, i, file, uploaded, modelFormat));
					} else if (isPdf(file, uploaded.mimeType)) {
						toAdd.push(makePdfNode(at, i, file, uploaded));
					} else if (uploaded.mimeType.startsWith("image/")) {
						const dims = await readImageDims(file).catch(
							() => DEFAULT_IMAGE_DIMS,
						);
						toAdd.push(makeImageNode(at, i, file, uploaded, dims));
					} else {
						toAdd.push(makeFileNode(at, i, file, uploaded));
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
