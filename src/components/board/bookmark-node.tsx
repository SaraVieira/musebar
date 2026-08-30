import { NodeResizer, type NodeProps, type Node } from "@xyflow/react";
import { NodeHandles } from "./node-handles";
import { useBoardCommit } from "#/lib/board/history-context";

interface BookmarkNodeData {
  url: string;
  title: string;
  description: string;
  image: string;
  favicon: string;
  [key: string]: unknown;
}

export type BookmarkNode = Node<BookmarkNodeData, "bookmark">;

export function BookmarkNodeView({
  data,
  selected,
  width,
  height,
}: NodeProps<BookmarkNode>) {
  const commit = useBoardCommit();
  const hostname = safeHost(data.url);
  return (
    <div className="group relative size-full" style={{ width, height }}>
      <NodeResizer
        minWidth={220}
        minHeight={120}
        isVisible={selected}
        onResizeStart={commit}
        lineClassName="!border-gray-900/40"
        handleClassName="!bg-white !border !border-gray-900/40 !size-2"
      />
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        onPointerDown={(e) => e.stopPropagation()}
        className="flex size-full flex-col overflow-hidden rounded-xl bg-white text-gray-800 no-underline shadow-md"
      >
        {data.image ? (
          <img
            src={data.image}
            alt=""
            className="h-1/2 w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="h-1/2 w-full bg-gray-100" />
        )}
        <div className="flex flex-1 flex-col gap-1 p-3">
          <div className="line-clamp-2 text-sm font-semibold">
            {data.title || hostname}
          </div>
          {data.description ? (
            <div className="text-muted-foreground line-clamp-2 text-xs">
              {data.description}
            </div>
          ) : null}
          <div className="mt-auto flex items-center gap-1.5 text-xs text-gray-500">
            {data.favicon ? (
              <img src={data.favicon} alt="" className="size-3.5" />
            ) : null}
            <span className="truncate">{hostname}</span>
          </div>
        </div>
      </a>
      <NodeHandles />
    </div>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
