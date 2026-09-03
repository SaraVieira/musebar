import type { Node, NodeProps } from "@xyflow/react";
import { BoardResizer } from "../board-resizer";
import { NodeHandles } from "../node-handles";

interface ImageNodeData {
	src: string;
	name: string;
	mimeType: string;
	[key: string]: unknown;
}

export type ImageNode = Node<ImageNodeData, "image">;

export function ImageNodeView({
	data,
	selected,
	width,
	height,
}: NodeProps<ImageNode>) {
	return (
		<div className="group relative size-full" style={{ width, height }}>
			<BoardResizer
				minWidth={80}
				minHeight={60}
				selected={selected}
				keepAspectRatio
			/>
			<img
				src={data.src}
				alt={data.name}
				draggable={false}
				onPointerDown={(e) => e.stopPropagation()}
				// object-contain, not cover: a moodboard should never hide part of an
				// image. Nodes are created at the image's own aspect ratio, so this only
				// shows when that ratio is off — a dimension probe that failed, or a
				// node saved before the ratio was tracked.
				className="size-full rounded-lg object-contain shadow-md"
			/>
			<NodeHandles />
		</div>
	);
}
