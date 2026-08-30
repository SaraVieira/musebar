import { NodeResizer, type NodeProps, type Node } from "@xyflow/react";
import { NodeHandles } from "./node-handles";
import { useBoardCommit } from "#/lib/board/history-context";

interface ImageNodeData {
  src: string;
  name: string;
  mimeType: string;
  [key: string]: unknown;
}

export type ImageNode = Node<ImageNodeData, "image">;

export function ImageNodeView({
  data,
  selected,
  width,
  height,
}: NodeProps<ImageNode>) {
  const commit = useBoardCommit();
  return (
    <div className="group relative size-full" style={{ width, height }}>
      <NodeResizer
        minWidth={80}
        minHeight={60}
        isVisible={selected}
        onResizeStart={commit}
        lineClassName="!border-gray-900/40"
        handleClassName="!bg-white !border !border-gray-900/40 !size-2"
        keepAspectRatio
      />
      <img
        src={data.src}
        alt={data.name}
        draggable={false}
        onPointerDown={(e) => e.stopPropagation()}
        className="size-full rounded-lg object-cover shadow-md"
      />
      <NodeHandles />
    </div>
  );
}
