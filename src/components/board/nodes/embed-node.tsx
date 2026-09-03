import type { Node, NodeProps } from "@xyflow/react";
import { BoardResizer } from "../board-resizer";
import { NodeDragHeader } from "../node-drag-header";
import { NodeHandles } from "../node-handles";

export const EMBED_DRAG_HANDLE_CLASS = "embed-drag-handle";

interface EmbedNodeData {
	src: string;
	title?: string;
	[key: string]: unknown;
}

export type EmbedNode = Node<EmbedNodeData, "embed">;

export function EmbedNodeView({
	data,
	selected,
	width,
	height,
}: NodeProps<EmbedNode>) {
	return (
		<div className="group relative size-full" style={{ width, height }}>
			<BoardResizer
				minWidth={200}
				minHeight={140}
				selected={selected}
				keepAspectRatio
			/>
			<div className="flex size-full flex-col overflow-hidden rounded-xl bg-black shadow-md">
				<NodeDragHeader
					handleClass={EMBED_DRAG_HANDLE_CLASS}
					className="h-6 justify-center bg-gray-900 text-gray-500 hover:text-gray-300"
				/>
				<iframe
					src={data.src}
					title={data.title ?? "Embedded content"}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					className="min-h-0 flex-1 border-0"
				/>
			</div>
			<NodeHandles />
		</div>
	);
}
