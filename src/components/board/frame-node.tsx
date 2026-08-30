import { useState } from "react";
import {
  NodeResizer,
  useReactFlow,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { NodeHandles } from "./node-handles";

interface FrameNodeData {
  title?: string;
  [key: string]: unknown;
}

export type FrameNode = Node<FrameNodeData, "frame">;

export function FrameNodeView({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<FrameNode>) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const title = data.title ?? "";

  return (
    <div className="group relative size-full" style={{ width, height }}>
      <NodeResizer
        minWidth={200}
        minHeight={120}
        isVisible={selected}
        lineClassName="!border-gray-900/40"
        handleClassName="!bg-white !border !border-gray-900/40 !size-2"
      />
      <div className="absolute -top-7 left-0 flex items-center gap-1">
        {editing ? (
          <input
            autoFocus
            defaultValue={title}
            onBlur={(e) => {
              updateNodeData(id, { title: e.target.value });
              setEditing(false);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs outline-none"
            placeholder="Frame"
          />
        ) : (
          <button
            type="button"
            onDoubleClick={() => setEditing(true)}
            className="cursor-text border-0 bg-transparent p-0 text-xs font-medium text-gray-700"
          >
            {title || "Frame"}
          </button>
        )}
      </div>
      <div className="size-full rounded-lg border-2 border-dashed border-gray-400/60 bg-gray-500/5" />
      <NodeHandles />
    </div>
  );
}
