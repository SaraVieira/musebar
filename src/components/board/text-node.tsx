import { useState } from "react";
import {
  NodeResizer,
  useReactFlow,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { NodeHandles } from "./node-handles";

interface TextNodeData {
  text?: string;
  color?: string;
  size?: number;
  [key: string]: unknown;
}

export type TextNode = Node<TextNodeData, "text">;

export function TextNodeView({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<TextNode>) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);

  const text = data.text ?? "";
  const color = data.color ?? "currentColor";
  const size = data.size ?? 18;

  return (
    <div className="group relative size-full" style={{ width, height }}>
      <NodeResizer
        minWidth={80}
        minHeight={30}
        isVisible={selected}
        lineClassName="!border-gray-900/40"
        handleClassName="!bg-white !border !border-gray-900/40 !size-2"
      />
      <div
        onDoubleClick={() => setEditing(true)}
        onPointerDown={(e) => {
          if (editing) e.stopPropagation();
        }}
        onKeyDown={(e) => {
          if (editing) e.stopPropagation();
        }}
        className="size-full leading-tight outline-none"
        style={{ color, fontSize: size, fontWeight: 500 }}
      >
        {editing ? (
          <textarea
            autoFocus
            defaultValue={text}
            onBlur={(e) => {
              updateNodeData(id, { text: e.target.value });
              setEditing(false);
            }}
            className="size-full resize-none border-none bg-transparent p-0 outline-none"
            style={{ color, fontSize: size, fontWeight: 500 }}
          />
        ) : text ? (
          <div className="whitespace-pre-wrap break-words">{text}</div>
        ) : (
          <div className="opacity-40">Double-click to write</div>
        )}
      </div>
      <NodeHandles />
    </div>
  );
}
