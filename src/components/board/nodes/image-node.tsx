import type { Node, NodeProps } from "@xyflow/react";
import { ImageOff } from "lucide-react";
import { useState } from "react";
import { BoardResizer } from "../board-resizer";
import { NodeHandles } from "../node-handles";
import { NodeUploadOverlay, Skeleton } from "../node-progress";

interface ImageNodeData {
	src: string;
	name: string;
	mimeType: string;
	uploading?: boolean;
	progress?: number;
	[key: string]: unknown;
}

export type ImageNode = Node<ImageNodeData, "image">;

export function ImageNodeView({
	data,
	selected,
	width,
	height,
}: NodeProps<ImageNode>) {
	const [status, setStatus] = useState<"loading" | "loaded" | "error">(
		"loading",
	);

	// The src changes when an upload completes, so the status has to reset with
	// it — otherwise a later image would inherit the previous one's "loaded".
	// Adjusting during render rather than in an effect: React re-runs this
	// component before painting, so no placeholder flash and no extra pass.
	const [renderedSrc, setRenderedSrc] = useState(data.src);
	if (renderedSrc !== data.src) {
		setRenderedSrc(data.src);
		setStatus("loading");
	}

	return (
		<div className="group relative size-full" style={{ width, height }}>
			<BoardResizer
				minWidth={80}
				minHeight={60}
				selected={selected}
				keepAspectRatio
			/>
			{status === "error" ? (
				<div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-gray-100 p-3 text-center">
					<ImageOff aria-hidden className="size-5" />
					<span className="max-w-full truncate text-xs">{data.name}</span>
					<span className="text-[10px]">Image failed to load</span>
				</div>
			) : (
				<>
					{status === "loading" && !data.uploading ? (
						<Skeleton className="absolute inset-0 size-full rounded-lg" />
					) : null}
					{data.src ? (
						<img
							key={data.src}
							src={data.src}
							alt={data.name}
							draggable={false}
							onPointerDown={(e) => e.stopPropagation()}
							onLoad={() => setStatus("loaded")}
							onError={() => setStatus("error")}
							// object-contain, not cover: a moodboard should never hide part
							// of an image. Nodes are created at the image's own aspect
							// ratio, so this only shows when that ratio is off.
							className="size-full rounded-lg object-contain shadow-md"
						/>
					) : null}
				</>
			)}
			{data.uploading ? (
				<NodeUploadOverlay name={data.name} progress={data.progress} />
			) : null}
			<NodeHandles />
		</div>
	);
}
