import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import { makeFileNode, makeImageNode } from "#/lib/board/factories";
import { readImageDims } from "#/lib/media-dims";

type SetNodes = (updater: (nodes: Node[]) => Node[]) => void;
type UploadFile = (file: File) => Promise<{
  id: string;
  src: string;
  mimeType: string;
}>;
type XY = { x: number; y: number };

const DEFAULT_IMAGE_DIMS = { w: 240, h: 180 };

// Upload each file and add the resulting node (image or file card) at the
// given position with a small stagger for multi-drops.
export function useAddFiles(setNodes: SetNodes, uploadFile: UploadFile) {
  return useCallback(
    async (files: File[], at: XY) => {
      const toAdd: Node[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const uploaded = await uploadFile(file);
          if (uploaded.mimeType.startsWith("image/")) {
            const dims = await readImageDims(file).catch(
              () => DEFAULT_IMAGE_DIMS,
            );
            toAdd.push(makeImageNode(at, i, file, uploaded, dims));
          } else {
            toAdd.push(makeFileNode(at, i, file, uploaded));
          }
        } catch (err) {
          console.error("[board] upload failed", err);
        }
      }
      if (toAdd.length > 0) setNodes((ns) => [...ns, ...toAdd]);
    },
    [setNodes, uploadFile],
  );
}
