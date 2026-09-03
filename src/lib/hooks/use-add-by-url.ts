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

const EMPTY_LINK_META = {
	title: "",
	description: "",
	image: "",
	favicon: "",
};

export function useAddByUrl(setNodes: SetNodes) {
	return useCallback(
		async (url: string, at: XY) => {
			const append = (node: Node) => setNodes((ns) => [...ns, node]);
			const patch = (id: string, data: Record<string, unknown>) =>
				setNodes((ns) =>
					ns.map((n) =>
						n.id === id ? { ...n, data: { ...n.data, ...data } } : n,
					),
				);

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

				case "bookmark": {
					// Placed immediately as a skeleton: fetchLinkMetadata can take up to
					// its 6s timeout, and a blank canvas for six seconds reads as a
					// dropped paste.
					const node = makeBookmarkNode(url, at, EMPTY_LINK_META);
					append({ ...node, data: { ...node.data, pending: true } });
					try {
						const meta = await fetchLinkMetadata({ data: { url } });
						patch(node.id, { ...meta, pending: false });
					} catch (err) {
						patch(node.id, { pending: false, failed: true });
						toast.error("Couldn't load link preview", {
							description: err instanceof Error ? err.message : undefined,
						});
					}
					return;
				}
			}
		},
		[setNodes],
	);
}
