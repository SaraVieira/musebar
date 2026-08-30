import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import { toast } from "sonner";
import { detectEmbed } from "#/components/board/embed-node";
import { fetchLinkMetadata } from "#/lib/link-metadata-server";
import { makeBookmarkNode, makeEmbedNode } from "#/lib/board/factories";

type SetNodes = (updater: (nodes: Node[]) => Node[]) => void;
type XY = { x: number; y: number };

export function useAddByUrl(setNodes: SetNodes) {
  return useCallback(
    async (url: string, at: XY) => {
      const embed = detectEmbed(url);
      if (embed) {
        setNodes((ns) => [...ns, makeEmbedNode(url, at, embed)]);
        return;
      }
      try {
        const meta = await fetchLinkMetadata({ data: { url } });
        setNodes((ns) => [...ns, makeBookmarkNode(url, at, meta)]);
      } catch (err) {
        toast.error("Couldn't add link", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    },
    [setNodes],
  );
}
