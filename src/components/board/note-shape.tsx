import { useMemo } from "react";
import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  T,
  createShapePropsMigrationIds,
  createShapePropsMigrationSequence,
  type RecordProps,
  type TLBaseShape,
  type TLResizeInfo,
  resizeBox,
} from "tldraw";
import { EditorContent, useEditor, generateHTML } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import type { Editor, JSONContent } from "@tiptap/react";
import { cn } from "#/lib/utils";
import { CARD_COLORS, ColorPicker } from "./color-picker";

export const NOTE_COLORS = CARD_COLORS;

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

function textToDoc(text: string): JSONContent {
  if (!text) return EMPTY_DOC;
  return {
    type: "doc",
    content: text.split(/\n{2,}/).map((para) => ({
      type: "paragraph",
      content: para
        ? [{ type: "text", text: para.replace(/\n/g, " ") }]
        : undefined,
    })),
  };
}

export interface NoteCardShapeProps {
  w: number;
  h: number;
  content: JSONContent;
  color: string;
}

declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    "note-card": NoteCardShapeProps;
  }
}

export type NoteCardShape = TLBaseShape<"note-card", NoteCardShapeProps>;

const versions = createShapePropsMigrationIds("note-card", {
  AddRichText: 1,
});

const migrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: versions.AddRichText,
      up(props) {
        const text = typeof props.text === "string" ? props.text : "";
        props.content = textToDoc(text);
        delete props.text;
      },
    },
  ],
});

export class NoteCardShapeUtil extends ShapeUtil<NoteCardShape> {
  static override type = "note-card" as const;
  static override props: RecordProps<NoteCardShape> = {
    w: T.number,
    h: T.number,
    content: T.jsonValue as unknown as RecordProps<NoteCardShape>["content"],
    color: T.string,
  };
  static override migrations = migrations;

  override getDefaultProps(): NoteCardShapeProps {
    return { w: 240, h: 160, content: EMPTY_DOC, color: NOTE_COLORS[0].value };
  }

  override canEdit = () => true;
  override canResize = () => true;
  override hideRotateHandle = () => true;

  override getGeometry(shape: NoteCardShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(shape: NoteCardShape, info: TLResizeInfo<NoteCardShape>) {
    return resizeBox(shape, info);
  }

  override getIndicatorPath(shape: NoteCardShape) {
    const path = new Path2D();
    const { w, h } = shape.props;
    path.roundRect(0, 0, w, h, 12);
    return path;
  }

  override component(shape: NoteCardShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const isSelected = this.editor
      .getSelectedShapeIds()
      .includes(shape.id);
    return (
      <NoteCardBody
        shape={shape}
        isEditing={isEditing}
        isSelected={isSelected}
        onChange={(content) =>
          this.editor.updateShape({
            id: shape.id,
            type: "note-card",
            props: { content },
          })
        }
        onColorChange={(color) =>
          this.editor.updateShape({
            id: shape.id,
            type: "note-card",
            props: { color },
          })
        }
      />
    );
  }
}

interface NoteCardBodyProps {
  shape: NoteCardShape;
  isEditing: boolean;
  isSelected: boolean;
  onChange: (content: JSONContent) => void;
  onColorChange: (color: string) => void;
}

function NoteCardBody({
  shape,
  isEditing,
  isSelected,
  onChange,
  onColorChange,
}: NoteCardBodyProps) {
  const html = useMemo(() => {
    try {
      return generateHTML(shape.props.content, EXTENSIONS);
    } catch {
      return "";
    }
  }, [shape.props.content]);

  return (
    <HTMLContainer
      className="relative overflow-visible"
      style={{
        width: shape.props.w,
        height: shape.props.h,
        pointerEvents: "all",
      }}
    >
      {isSelected ? (
        <ColorPicker
          selected={shape.props.color}
          onSelect={onColorChange}
        />
      ) : null}
      <div
        className="size-full overflow-auto rounded-xl p-3 text-sm text-gray-800 shadow-md"
        style={{ background: shape.props.color }}
      >
        {isEditing ? (
          <NoteEditor
            shapeId={shape.id}
            initialContent={shape.props.content}
            onChange={onChange}
          />
        ) : (
          <div
            className="note-card-content"
            dangerouslySetInnerHTML={{ __html: html || placeholderHtml() }}
          />
        )}
      </div>
    </HTMLContainer>
  );
}

function placeholderHtml() {
  return `<p style="opacity:0.5;margin:0;">Double-click to edit</p>`;
}

interface NoteEditorProps {
  shapeId: string;
  initialContent: JSONContent;
  onChange: (content: JSONContent) => void;
}

function NoteEditor({ initialContent, onChange }: NoteEditorProps) {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: initialContent,
    autofocus: "end",
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "note-card-content note-card-editor",
      },
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
