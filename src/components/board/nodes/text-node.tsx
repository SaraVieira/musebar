import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import { useBoardCommit } from "#/lib/board/history-context";
import { BoardResizer } from "../board-resizer";
import { NodeHandles } from "../node-handles";

interface TextNodeData {
	text?: string;
	color?: string;
	size?: number;
	[key: string]: unknown;
}

export type TextNode = Node<TextNodeData, "text">;

export function TextNodeView({
	id,
	data,
	selected,
	width,
	height,
}: NodeProps<TextNode>) {
	const { updateNodeData } = useReactFlow();
	const commit = useBoardCommit();
	const [editing, setEditing] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (editing) textareaRef.current?.focus();
	}, [editing]);

	const text = data.text ?? "";
	const color = data.color ?? "currentColor";
	const size = data.size ?? 18;

	return (
		<div className="group relative size-full" style={{ width, height }}>
			<BoardResizer minWidth={80} minHeight={30} selected={selected} />
			{/* Double-click to edit. A keyboard path for this needs React Flow's
			    node focus model, which the board does not wire up yet. */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard path tracked as board-wide a11y work */}
			<div
				onDoubleClick={() => {
					commit();
					setEditing(true);
				}}
				onPointerDown={(e) => {
					if (editing) e.stopPropagation();
				}}
				onKeyDown={(e) => {
					if (editing) e.stopPropagation();
				}}
				className="size-full leading-tight outline-none"
				style={{ color, fontSize: size, fontWeight: 500 }}
			>
				{editing ? (
					<textarea
						ref={textareaRef}
						defaultValue={text}
						onBlur={(e) => {
							updateNodeData(id, { text: e.target.value });
							setEditing(false);
						}}
						className="size-full resize-none border-none bg-transparent p-0 outline-none"
						style={{ color, fontSize: size, fontWeight: 500 }}
					/>
				) : text ? (
					<div className="whitespace-pre-wrap wrap-break-word">{text}</div>
				) : (
					<div className="opacity-40">Double-click to write</div>
				)}
			</div>
			<NodeHandles />
		</div>
	);
}
