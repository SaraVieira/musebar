import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import { toast } from "sonner";
import { detectEmbed } from "#/components/board/nodes/embed-node";
import { fetchLinkMetadata } from "#/lib/link-metadata-server";
import { fetchMapMetadata } from "#/lib/map-metadata-server";
import {
  makeBookmarkNode,
  makeEmbedNode,
  makeImageNodeFromUrl,
  makeMapNode,
} from "#/lib/board/factories";
import { readImageDimsFromUrl } from "#/lib/media-dims";

type SetNodes = (updater: (nodes: Node[]) => Node[]) => void;
type XY = { x: number; y: number };

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(?:$|[?#])/i;
const DEFAULT_IMAGE_DIMS = { w: 480, h: 320 };

function isImageUrl(url: string): boolean {
  try {
    return IMAGE_EXT_RE.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

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
      if (isImageUrl(url)) {
        const dims = await readImageDimsFromUrl(url).catch(
          () => DEFAULT_IMAGE_DIMS,
        );
        setNodes((ns) => [...ns, makeImageNodeFromUrl(at, url, dims)]);
        return;
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
