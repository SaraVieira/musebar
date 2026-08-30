import { GripHorizontal } from "lucide-react";
import { NodeResizer, type NodeProps, type Node } from "@xyflow/react";
import { NodeHandles } from "./node-handles";
import { useBoardCommit } from "#/lib/board/history-context";

export const EMBED_DRAG_HANDLE_CLASS = "embed-drag-handle";

interface EmbedNodeData {
  src: string;
  title?: string;
  [key: string]: unknown;
}

export type EmbedNode = Node<EmbedNodeData, "embed">;

export function EmbedNodeView({
  data,
  selected,
  width,
  height,
}: NodeProps<EmbedNode>) {
  const commit = useBoardCommit();
  return (
    <div className="group relative size-full" style={{ width, height }}>
      <NodeResizer
        minWidth={200}
        minHeight={140}
        isVisible={selected}
        keepAspectRatio
        onResizeStart={commit}
        lineClassName="!border-gray-900/40"
        handleClassName="!bg-white !border !border-gray-900/40 !size-2"
      />
      <div className="flex size-full flex-col overflow-hidden rounded-xl bg-black shadow-md">
        <div
          className={`${EMBED_DRAG_HANDLE_CLASS} flex h-6 shrink-0 cursor-grab items-center justify-center bg-gray-900 text-gray-500 hover:text-gray-300 active:cursor-grabbing`}
          title="Drag to move"
        >
          <GripHorizontal aria-hidden className="size-3.5" />
        </div>
        <iframe
          src={data.src}
          title={data.title ?? "Embedded content"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="min-h-0 flex-1 border-0"
        />
      </div>
      <NodeHandles />
    </div>
  );
}

export function detectEmbed(
  url: string,
): { src: string; w: number; h: number } | null {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) {
    return {
      src: `https://www.youtube.com/embed/${yt[1]}`,
      w: 480,
      h: 270,
    };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return {
      src: `https://player.vimeo.com/video/${vimeo[1]}`,
      w: 480,
      h: 270,
    };
  }

  const loom = url.match(/loom\.com\/share\/([\w-]+)/);
  if (loom) {
    return {
      src: `https://www.loom.com/embed/${loom[1]}`,
      w: 480,
      h: 270,
    };
  }

  return null;
}
