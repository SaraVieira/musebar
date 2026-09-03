import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { useNodeEditing } from "#/lib/board/editing-context";
import { useBoardCommit } from "#/lib/board/history-context";
import { BoardResizer } from "../board-resizer";
import { NodeHandles } from "../node-handles";

interface FrameNodeData {
	title?: string;
	[key: string]: unknown;
}

export type FrameNode = Node<FrameNodeData, "frame">;

export function FrameNodeView({
	id,
	data,
	selected,
	width,
	height,
}: NodeProps<FrameNode>) {
	const { updateNodeData } = useReactFlow();
	const commit = useBoardCommit();
	const { isEditing, startEditing, stopEditing } = useNodeEditing(id);
	const inputRef = useRef<HTMLInputElement>(null);
	const title = data.title ?? "";

	useEffect(() => {
		if (isEditing) inputRef.current?.select();
	}, [isEditing]);

	return (
		<div className="group relative size-full" style={{ width, height }}>
			<BoardResizer minWidth={200} minHeight={120} selected={selected} />
			<div className="absolute -top-7 left-0 flex items-center gap-1">
				{isEditing ? (
					<input
						ref={inputRef}
						defaultValue={title}
						onBlur={(e) => {
							updateNodeData(id, { title: e.target.value });
							stopEditing();
						}}
						onKeyDown={(e) => {
							e.stopPropagation();
							if (e.key === "Enter" || e.key === "Escape") {
								(e.target as HTMLInputElement).blur();
							}
						}}
						onPointerDown={(e) => e.stopPropagation()}
						className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs outline-none"
						placeholder="Frame"
					/>
				) : (
					<button
						type="button"
						onDoubleClick={() => {
							commit();
							startEditing();
						}}
						className="cursor-text border-0 bg-transparent p-0 text-xs font-medium text-gray-700"
					>
						{title || "Frame"}
					</button>
				)}
			</div>
			<div className="size-full rounded-lg border-2 border-dashed border-gray-400/60 bg-gray-500/5" />
			<NodeHandles />
		</div>
	);
}
