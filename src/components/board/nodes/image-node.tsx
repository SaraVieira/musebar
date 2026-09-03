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
				className="size-full rounded-lg object-cover shadow-md"
			/>
			<NodeHandles />
		</div>
	);
}
