import { useMemo, useState } from "react";
import { NodeResizer, useReactFlow, type NodeProps, type Node } from "@xyflow/react";
import { EditorContent, generateHTML, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import type { Editor, JSONContent } from "@tiptap/react";
import { CARD_COLORS, ColorPicker } from "./color-picker";
import { NodeHandles } from "./node-handles";
import { cn } from "#/lib/utils";

const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    horizontalRule: false,
    codeBlock: false,
    blockquote: false,
  }),
];

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export interface NoteNodeData {
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
  const [editing, setEditing] = useState(false);

  const content = data.content ?? EMPTY_DOC;
  const color = data.color ?? CARD_COLORS[0].value;

  const html = useMemo(() => {
    try {
      return generateHTML(content, EXTENSIONS);
    } catch {
      return "";
    }
  }, [content]);

  return (
    <div
      className="group relative size-full"
      style={{ width, height }}
    >
      <NodeResizer
        minWidth={160}
        minHeight={100}
        isVisible={selected}
        lineClassName="!border-gray-900/40"
        handleClassName="!bg-white !border !border-gray-900/40 !size-2"
      />
      {selected ? (
        <ColorPicker
          selected={color}
          onSelect={(c) => updateNodeData(id, { color: c })}
        />
      ) : null}
      <div
        onDoubleClick={() => setEditing(true)}
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

function NoteEditor({
  initialContent,
  onChange,
  onBlur,
}: {
  initialContent: JSONContent;
  onChange: (c: JSONContent) => void;
  onBlur: () => void;
}) {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: initialContent,
    autofocus: "end",
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
    onBlur() {
      onBlur();
    },
    editorProps: {
      attributes: { class: "note-card-content note-card-editor" },
    },
  });

  if (!editor) return null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="h-full"
    >
      <NoteToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function NoteToolbar({ editor }: { editor: Editor }) {
  const btn = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "cursor-pointer rounded border-0 px-1.5 py-0.5 text-xs text-inherit outline-none",
        active ? "bg-black/10" : "bg-transparent",
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="sticky -top-3 z-[1] -mx-3 -mt-3 mb-1.5 flex gap-0.5 border-b border-black/5 bg-gradient-to-b from-white/85 to-white/60 px-3 py-2 opacity-90 backdrop-blur-sm">
      {btn("B", editor.isActive("bold"), () =>
        editor.chain().focus().toggleBold().run(),
      )}
      {btn("I", editor.isActive("italic"), () =>
        editor.chain().focus().toggleItalic().run(),
      )}
      {btn("H", editor.isActive("heading", { level: 2 }), () =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
      )}
      {btn("•", editor.isActive("bulletList"), () =>
        editor.chain().focus().toggleBulletList().run(),
      )}
      {btn("1.", editor.isActive("orderedList"), () =>
        editor.chain().focus().toggleOrderedList().run(),
      )}
    </div>
  );
}
