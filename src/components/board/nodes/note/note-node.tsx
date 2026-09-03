import type { JSONContent } from "@tiptap/react";
import { generateHTML } from "@tiptap/react";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { useMemo, useState } from "react";
import { useBoardCommit } from "#/lib/board/history-context";
import { BoardResizer } from "../../board-resizer";
import { CARD_COLORS, ColorPicker } from "../../color-picker";
import { NodeHandles } from "../../node-handles";
import { EMPTY_NOTE_DOC, NOTE_EXTENSIONS } from "./extensions";
import { NoteEditor } from "./note-editor";

interface NoteNodeData {
	content?: JSONContent;
	color?: string;
	[key: string]: unknown;
}

export type NoteNode = Node<NoteNodeData, "note">;

export function NoteNodeView({
	id,
	data,
	selected,
	width,
	height,
}: NodeProps<NoteNode>) {
	const { updateNodeData } = useReactFlow();
	const commit = useBoardCommit();
	const [editing, setEditing] = useState(false);

	const content = data.content ?? EMPTY_NOTE_DOC;
	const color = data.color ?? CARD_COLORS[0].value;

	const html = useMemo(() => {
		try {
			return generateHTML(content, NOTE_EXTENSIONS);
		} catch {
			return "";
		}
	}, [content]);

	return (
		<div className="group relative size-full" style={{ width, height }}>
			<BoardResizer minWidth={160} minHeight={100} selected={selected} />
			{selected ? (
				<ColorPicker
					selected={color}
					onSelect={(c) => {
						commit();
						updateNodeData(id, { color: c });
					}}
				/>
			) : null}
			{/* Double-click to edit. A keyboard path for this needs React Flow's
			    node focus model, which the board does not wire up yet. */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard path tracked as board-wide a11y work */}
			<div
				onDoubleClick={() => {
					commit();
					setEditing(true);
				}}
				className="size-full overflow-auto rounded-xl p-3 text-sm text-gray-800 shadow-md"
				style={{ background: color }}
			>
				{editing ? (
					<NoteEditor
						initialContent={content}
						onChange={(c) => updateNodeData(id, { content: c })}
						onBlur={() => setEditing(false)}
					/>
				) : (
					<div
						className="note-card-content"
						// HTML comes from TipTap's generateHTML over a schema-constrained
						// doc, so it is not arbitrary markup. The real hardening is
						// validating project.content on load, which is still outstanding.
						// biome-ignore lint/security/noDangerouslySetInnerHtml: schema-constrained TipTap output
						dangerouslySetInnerHTML={{
							__html:
								html ||
								`<p style="opacity:0.5;margin:0;">Double-click to edit</p>`,
						}}
					/>
				)}
			</div>
			<NodeHandles />
		</div>
	);
}
