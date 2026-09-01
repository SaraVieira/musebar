import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import { toast } from "sonner";
import { detectEmbed } from "#/components/board/nodes/embed-node";
import { fetchLinkMetadata } from "#/lib/link-metadata-server";
import { fetchMapMetadata } from "#/lib/map-metadata-server";
import {
  makeBookmarkNode,
  makeEmbedNode,
  makeMapNode,
} from "#/lib/board/factories";

type SetNodes = (updater: (nodes: Node[]) => Node[]) => void;
type XY = { x: number; y: number };

function isGoogleMapsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === "maps.google.com") return true;
    if (host === "maps.app.goo.gl") return true;
    if (host === "goo.gl" && u.pathname.startsWith("/maps")) return true;
    if (
      (host === "www.google.com" || host === "google.com") &&
      u.pathname.startsWith("/maps")
    )
      return true;
    return false;
  } catch {
    return false;
  }
}

export function useAddByUrl(setNodes: SetNodes) {
  return useCallback(
    async (url: string, at: XY) => {
      if (isGoogleMapsUrl(url)) {
        try {
          const meta = await fetchMapMetadata({ data: { url } });
          setNodes((ns) => [...ns, makeMapNode(at, meta)]);
          return;
        } catch (err) {
          toast.error("Couldn't add map", {
            description: err instanceof Error ? err.message : undefined,
          });
          return;
        }
      }
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
