import type { Editor } from "@tiptap/react";
import { cn } from "#/lib/utils";

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
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
}

export function NoteToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="sticky -top-3 z-[1] -mx-3 -mt-3 mb-1.5 flex gap-0.5 border-b border-black/5 bg-gradient-to-b from-white/85 to-white/60 px-3 py-2 opacity-90 backdrop-blur-sm">
      <ToolbarButton
        label="B"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="I"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="H"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="•"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="1."
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
    </div>
  );
}
