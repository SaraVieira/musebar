import { useMemo, useState } from "react";
import {
  NodeResizer,
  useReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { generateHTML } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";
import { CARD_COLORS, ColorPicker } from "../../color-picker";
import { NodeHandles } from "../../node-handles";
import { useBoardCommit } from "#/lib/board/history-context";
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
      <NodeResizer
        minWidth={160}
        minHeight={100}
        isVisible={selected}
        onResizeStart={commit}
        lineClassName="!border-gray-900/40"
        handleClassName="!bg-white !border !border-gray-900/40 !size-2"
      />
      {selected ? (
        <ColorPicker
          selected={color}
          onSelect={(c) => {
            commit();
            updateNodeData(id, { color: c });
          }}
        />
      ) : null}
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
