import type { Node } from "@xyflow/react";
import { useCallback } from "react";
import { toast } from "sonner";
import { detectEmbed, detectUrlKind } from "#/lib/board/detect";
import {
	makeBookmarkNode,
	makeEmbedNode,
	makeImageNodeFromUrl,
	makeMapNode,
	makePdfNodeFromUrl,
} from "#/lib/board/factories";
import { fetchLinkMetadata } from "#/lib/link-metadata-server";
import { fetchMapMetadata } from "#/lib/map-metadata-server";
import { readImageDimsFromUrl } from "#/lib/media-dims";

type SetNodes = (updater: (nodes: Node[]) => Node[]) => void;
type XY = { x: number; y: number };

const DEFAULT_IMAGE_DIMS = { w: 480, h: 320 };

export function useAddByUrl(setNodes: SetNodes) {
	return useCallback(
		async (url: string, at: XY) => {
			const append = (node: Node) => setNodes((ns) => [...ns, node]);

			switch (detectUrlKind(url)) {
				case "map":
					try {
						append(makeMapNode(at, await fetchMapMetadata({ data: { url } })));
					} catch (err) {
						toast.error("Couldn't add map", {
							description: err instanceof Error ? err.message : undefined,
						});
					}
					return;

				case "image": {
					const dims = await readImageDimsFromUrl(url).catch(
						() => DEFAULT_IMAGE_DIMS,
					);
					append(makeImageNodeFromUrl(at, url, dims));
					return;
				}

				case "pdf":
					append(makePdfNodeFromUrl(at, url));
					return;

				case "embed": {
					const embed = detectEmbed(url);
					if (embed) append(makeEmbedNode(url, at, embed));
					return;
				}

				case "bookmark":
					try {
						append(
							makeBookmarkNode(
								url,
								at,
								await fetchLinkMetadata({ data: { url } }),
							),
						);
					} catch (err) {
						toast.error("Couldn't add link", {
							description: err instanceof Error ? err.message : undefined,
						});
					}
					return;
			}
		},
		[setNodes],
	);
}
