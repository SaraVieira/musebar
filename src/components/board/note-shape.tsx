import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  T,
  type RecordProps,
  type TLBaseShape,
  type TLResizeInfo,
  resizeBox,
} from "tldraw";

export interface NoteCardShapeProps {
  w: number;
  h: number;
  text: string;
  color: string;
}

declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    "note-card": NoteCardShapeProps;
  }
}

export type NoteCardShape = TLBaseShape<"note-card", NoteCardShapeProps>;

export class NoteCardShapeUtil extends ShapeUtil<NoteCardShape> {
  static override type = "note-card" as const;
  static override props: RecordProps<NoteCardShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
    color: T.string,
  };

  override getDefaultProps(): NoteCardShapeProps {
    return { w: 240, h: 160, text: "", color: "#fef3c7" };
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
    const r = 12;
    const { w, h } = shape.props;
    path.roundRect(0, 0, w, h, r);
    return path;
  }

  override component(shape: NoteCardShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;
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
          overflow: "hidden",
        }}
      >
        {isEditing ? (
          <textarea
            autoFocus
            defaultValue={shape.props.text}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) =>
              this.editor.updateShape({
                id: shape.id,
                type: "note-card",
                props: { text: e.target.value },
              })
            }
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              resize: "none",
              fontFamily: "inherit",
              fontSize: "inherit",
              color: "inherit",
            }}
          />
        ) : (
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {shape.props.text || (
              <span style={{ opacity: 0.5 }}>Double-click to edit</span>
            )}
          </div>
        )}
      </HTMLContainer>
    );
  }
}
