import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { useNodeEditing } from "#/lib/board/editing-context";
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
	const { isEditing, startEditing, stopEditing } = useNodeEditing(id);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Focus whether editing was entered by double-click or by Enter on the
	// focused node, so the keyboard path lands in the textarea.
	useEffect(() => {
		if (isEditing) textareaRef.current?.focus();
	}, [isEditing]);

	const text = data.text ?? "";
	const color = data.color ?? "currentColor";
	const size = data.size ?? 18;

	return (
		<div className="group relative size-full" style={{ width, height }}>
			<BoardResizer minWidth={80} minHeight={30} selected={selected} />
			{/* Double-click is a pointer shortcut for the same thing Enter does on
			    the focused node; React Flow's node wrapper is the focusable,
			    role-bearing element, so this div is not the control. */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard path lives on React Flow's node wrapper */}
			<div
				onDoubleClick={() => {
					commit();
					startEditing();
				}}
				onPointerDown={(e) => {
					if (isEditing) e.stopPropagation();
				}}
				onKeyDown={(e) => {
					if (!isEditing) return;
					e.stopPropagation();
					if (e.key === "Escape") {
						e.preventDefault();
						textareaRef.current?.blur();
					}
				}}
				className="size-full leading-tight outline-none"
				style={{ color, fontSize: size, fontWeight: 500 }}
			>
				{isEditing ? (
					<textarea
						ref={textareaRef}
						defaultValue={text}
						onBlur={(e) => {
							updateNodeData(id, { text: e.target.value });
							stopEditing();
						}}
						className="size-full resize-none border-none bg-transparent p-0 outline-none"
						style={{ color, fontSize: size, fontWeight: 500 }}
					/>
				) : text ? (
					<div className="whitespace-pre-wrap wrap-break-word">{text}</div>
				) : (
					<div className="opacity-40">Double-click or press Enter to write</div>
				)}
			</div>
			<NodeHandles />
		</div>
	);
}
