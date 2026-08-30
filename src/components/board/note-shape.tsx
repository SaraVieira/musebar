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
    return { w: 240, h: 160, content: EMPTY_DOC, color: "#fef3c7" };
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
    return (
      <NoteCardBody
        shape={shape}
        isEditing={isEditing}
        onChange={(content) =>
          this.editor.updateShape({
            id: shape.id,
            type: "note-card",
            props: { content },
          })
        }
      />
    );
  }
}

interface NoteCardBodyProps {
  shape: NoteCardShape;
  isEditing: boolean;
  onChange: (content: JSONContent) => void;
}

function NoteCardBody({ shape, isEditing, onChange }: NoteCardBodyProps) {
  const html = useMemo(() => {
    try {
      return generateHTML(shape.props.content, EXTENSIONS);
    } catch {
      return "";
    }
  }, [shape.props.content]);

  return (
    <HTMLContainer
      style={{
        width: shape.props.w,
        height: shape.props.h,
        background: shape.props.color,
        borderRadius: 12,
        boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
        padding: 12,
        pointerEvents: "all",
        fontFamily: "inherit",
        fontSize: 14,
        color: "#1f2937",
        overflow: "auto",
      }}
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
      style={{ height: "100%" }}
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
      style={{
        border: "none",
        background: active ? "rgba(0,0,0,0.12)" : "transparent",
        borderRadius: 4,
        padding: "2px 6px",
        cursor: "pointer",
        fontSize: 12,
        fontFamily: "inherit",
        color: "inherit",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        marginBottom: 6,
        opacity: 0.9,
        position: "sticky",
        top: -12,
        marginTop: -12,
        marginLeft: -12,
        marginRight: -12,
        padding: "8px 12px",
        background:
          "linear-gradient(to bottom, rgba(255,255,255,0.85), rgba(255,255,255,0.6))",
        backdropFilter: "blur(4px)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        zIndex: 1,
      }}
    >
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
