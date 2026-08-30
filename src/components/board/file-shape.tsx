import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  T,
  resizeBox,
  type RecordProps,
  type TLBaseShape,
  type TLResizeInfo,
} from "tldraw";
import { FileIcon } from "@react-symbols/icons/utils";

export interface FileCardShapeProps {
  w: number;
  h: number;
  src: string;
  name: string;
  mimeType: string;
  size: number;
}

declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    "file-card": FileCardShapeProps;
  }
}

export type FileCardShape = TLBaseShape<"file-card", FileCardShapeProps>;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeLabel(name: string, mimeType: string) {
  const ext = name.split(".").pop();
  if (ext && ext !== name && ext.length <= 5) return ext.toUpperCase();
  const subtype = mimeType.split("/")[1];
  return subtype ? subtype.toUpperCase() : "FILE";
}

export class FileCardShapeUtil extends ShapeUtil<FileCardShape> {
  static override type = "file-card" as const;
  static override props: RecordProps<FileCardShape> = {
    w: T.number,
    h: T.number,
    src: T.string,
    name: T.string,
    mimeType: T.string,
    size: T.number,
  };

  override getDefaultProps(): FileCardShapeProps {
    return {
      w: 240,
      h: 96,
      src: "",
      name: "file",
      mimeType: "application/octet-stream",
      size: 0,
    };
  }

  override canResize = () => true;
  override hideRotateHandle = () => true;

  override getGeometry(shape: FileCardShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(shape: FileCardShape, info: TLResizeInfo<FileCardShape>) {
    return resizeBox(shape, info);
  }

  override getIndicatorPath(shape: FileCardShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 12);
    return path;
  }

  override component(shape: FileCardShape) {
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
          padding: 12,
          pointerEvents: "all",
          display: "flex",
          alignItems: "center",
          gap: 12,
          overflow: "hidden",
          color: "#1f2937",
          fontFamily: "inherit",
          fontSize: 13,
        }}
      >
        <div style={{ flexShrink: 0, width: 40, height: 40 }}>
          <FileIcon fileName={shape.props.name} autoAssign width={40} height={40} />
        </div>
        <a
          href={shape.props.src}
          download={shape.props.name}
          target="_blank"
          rel="noopener noreferrer"
          onPointerDown={(e) => e.stopPropagation()}
          className="tl-file-card-link"
          style={{
            minWidth: 0,
            flex: 1,
            color: "inherit",
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {shape.props.name}
          </div>
          <div style={{ opacity: 0.6, fontSize: 12 }}>
            {fileTypeLabel(shape.props.name, shape.props.mimeType)} ·{" "}
            {formatBytes(shape.props.size)}
          </div>
        </a>
        <style>{`.tl-file-card-link:hover > div:first-child { text-decoration: underline; }`}</style>
      </HTMLContainer>
    );
  }
}
