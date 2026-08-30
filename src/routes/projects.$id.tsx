import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeTypes,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  Frame,
  ListChecks,
  StickyNote,
  Type,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { getSession } from "#/lib/auth-server";
import { getProject } from "#/lib/projects-server";
import { fetchLinkMetadata } from "#/lib/link-metadata-server";
import { NoteNodeView, type NoteNode } from "#/components/board/note-node";
import { TodoNodeView, type TodoNode } from "#/components/board/todo-node";
import { FileNodeView, type FileNode } from "#/components/board/file-node";
import { ImageNodeView, type ImageNode } from "#/components/board/image-node";
import {
  BookmarkNodeView,
  type BookmarkNode,
} from "#/components/board/bookmark-node";
import { TextNodeView, type TextNode } from "#/components/board/text-node";
import { FrameNodeView, type FrameNode } from "#/components/board/frame-node";
import {
  EmbedNodeView,
  EMBED_DRAG_HANDLE_CLASS,
  detectEmbed,
  type EmbedNode,
} from "#/components/board/embed-node";
import { useBoard } from "#/lib/hooks/use-board";
import { readImageDims } from "#/lib/media-dims";

const nodeTypes: NodeTypes = {
  note: NoteNodeView,
  todo: TodoNodeView,
  file: FileNodeView,
  image: ImageNodeView,
  bookmark: BookmarkNodeView,
  text: TextNodeView,
  frame: FrameNodeView,
  embed: EmbedNodeView,
};

export const Route = createFileRoute("/projects/$id")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ href: "/login" });
  },
  loader: async ({ params }) => {
    const project = await getProject({ data: { id: params.id } });
    if (!project) throw notFound();
    return { project };
  },
  component: BoardRoute,
});

function BoardRoute() {
  return (
    <ReactFlowProvider>
      <Board />
    </ReactFlowProvider>
  );
}

function Board() {
  const { project } = Route.useLoaderData();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    uploadFile,
  } = useBoard(project);
  const rf = useReactFlow();

  const boardCenter = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return rf.screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, [rf]);

  const addNote = useCallback(() => {
    const { x, y } = boardCenter();
    const node: NoteNode = {
      id: crypto.randomUUID(),
      type: "note",
      position: { x: x - 120, y: y - 80 },
      width: 240,
      height: 160,
      data: {},
    };
    setNodes((ns) => [...ns, node]);
  }, [boardCenter, setNodes]);

  const addTodo = useCallback(() => {
    const { x, y } = boardCenter();
    const node: TodoNode = {
      id: crypto.randomUUID(),
      type: "todo",
      position: { x: x - 130, y: y - 100 },
      width: 260,
      height: 200,
      data: { items: [{ id: crypto.randomUUID(), text: "", done: false }] },
    };
    setNodes((ns) => [...ns, node]);
  }, [boardCenter, setNodes]);

  const addText = useCallback(() => {
    const { x, y } = boardCenter();
    const node: TextNode = {
      id: crypto.randomUUID(),
      type: "text",
      position: { x: x - 100, y: y - 20 },
      width: 200,
      height: 40,
      data: {},
    };
    setNodes((ns) => [...ns, node]);
  }, [boardCenter, setNodes]);

  const addFrame = useCallback(() => {
    const { x, y } = boardCenter();
    const node: FrameNode = {
      id: crypto.randomUUID(),
      type: "frame",
      position: { x: x - 200, y: y - 150 },
      width: 400,
      height: 300,
      data: {},
      selectable: true,
      draggable: true,
    };
    setNodes((ns) => [node, ...ns]);
  }, [boardCenter, setNodes]);

  const handleUrl = useCallback(
    async (url: string, at: { x: number; y: number }) => {
      const embed = detectEmbed(url);
      if (embed) {
        const node: EmbedNode = {
          id: crypto.randomUUID(),
          type: "embed",
          position: { x: at.x - embed.w / 2, y: at.y - embed.h / 2 },
          width: embed.w,
          height: embed.h,
          dragHandle: `.${EMBED_DRAG_HANDLE_CLASS}`,
          data: { src: embed.src, title: url },
        };
        setNodes((ns) => [...ns, node]);
        return;
      }
      try {
        const meta = await fetchLinkMetadata({ data: { url } });
        const node: BookmarkNode = {
          id: crypto.randomUUID(),
          type: "bookmark",
          position: { x: at.x - 140, y: at.y - 100 },
          width: 280,
          height: 220,
          data: {
            url,
            title: meta.title,
            description: meta.description,
            image: meta.image,
            favicon: meta.favicon,
          },
        };
        setNodes((ns) => [...ns, node]);
      } catch (err) {
        console.error("[board] bookmark failed", err);
      }
    },
    [setNodes],
  );

  const handleFiles = useCallback(
    async (files: File[], at: { x: number; y: number }) => {
      const toAdd: Node[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const uploaded = await uploadFile(file);
          const offset = i * 16;
          if (uploaded.mimeType.startsWith("image/")) {
            const { w, h } = await readImageDims(file).catch(() => ({
              w: 240,
              h: 180,
            }));
            const scale = Math.min(1, 320 / Math.max(w, h));
            const node: ImageNode = {
              id: crypto.randomUUID(),
              type: "image",
              position: {
                x: at.x - (w * scale) / 2 + offset,
                y: at.y - (h * scale) / 2 + offset,
              },
              width: Math.round(w * scale),
              height: Math.round(h * scale),
              data: {
                src: uploaded.src,
                name: file.name,
                mimeType: uploaded.mimeType,
              },
            };
            toAdd.push(node);
          } else {
            const node: FileNode = {
              id: crypto.randomUUID(),
              type: "file",
              position: { x: at.x - 120 + offset, y: at.y - 48 + offset },
              width: 240,
              height: 96,
              data: {
                src: uploaded.src,
                name: file.name,
                mimeType: uploaded.mimeType || "application/octet-stream",
                size: file.size,
              },
            };
            toAdd.push(node);
          }
        } catch (err) {
          console.error("[board] upload failed", err);
        }
      }
      if (toAdd.length > 0) setNodes((ns) => [...ns, ...toAdd]);
    },
    [uploadFile, setNodes],
  );

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const at = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const files = Array.from(e.dataTransfer?.files ?? []);
      const url =
        e.dataTransfer?.getData("text/uri-list") ||
        e.dataTransfer?.getData("text/plain");
      if (files.length > 0) return handleFiles(files, at);
      if (url && /^https?:\/\//i.test(url.trim())) {
        return handleUrl(url.trim().split(/\s+/)[0], at);
      }
    },
    [rf, handleFiles, handleUrl],
  );

  // Paste handler: files → upload, URL → bookmark/embed. Attached to the
  // window so it fires regardless of what has focus on the canvas.
  useEffect(() => {
    function isEditableTarget(t: EventTarget | null) {
      if (!(t instanceof HTMLElement)) return false;
      if (t.isContentEditable) return true;
      const tag = t.tagName;
      return tag === "INPUT" || tag === "TEXTAREA";
    }

    async function onPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return;
      // Don't hijack pastes into text fields, editors, checkboxes, etc.
      if (isEditableTarget(e.target)) return;

      const at = boardCenter();

      const files = Array.from(e.clipboardData.files ?? []);
      if (files.length > 0) {
        e.preventDefault();
        await handleFiles(files, at);
        return;
      }

      const url = e.clipboardData.getData("text/uri-list")
        || e.clipboardData.getData("text/plain");
      if (url && /^https?:\/\//i.test(url.trim())) {
        e.preventDefault();
        await handleUrl(url.trim().split(/\s+/)[0], at);
      }
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [boardCenter, handleFiles, handleUrl]);

  // When a node is dropped on top of a frame, adopt it as a child of that
  // frame. When dragged out of its current frame parent, detach. Frames
  // themselves are never re-parented.
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_e, dragged) => {
      if (dragged.type === "frame") return;
      const all = rf.getNodes();

      const absPos = (n: Node): { x: number; y: number } => {
        if (!n.parentId) return n.position;
        const parent = all.find((p) => p.id === n.parentId);
        if (!parent) return n.position;
        const pa = absPos(parent);
        return { x: pa.x + n.position.x, y: pa.y + n.position.y };
      };

      const dragAbs = absPos(dragged);
      const w = dragged.width ?? 0;
      const h = dragged.height ?? 0;
      const cx = dragAbs.x + w / 2;
      const cy = dragAbs.y + h / 2;

      let target: Node | null = null;
      for (const n of all) {
        if (n.type !== "frame" || n.id === dragged.id) continue;
        const fa = absPos(n);
        const fw = n.width ?? 0;
        const fh = n.height ?? 0;
        if (cx >= fa.x && cx <= fa.x + fw && cy >= fa.y && cy <= fa.y + fh) {
          target = n; // last match wins → topmost frame at that point
        }
      }

      const currentParentId = dragged.parentId ?? null;
      const targetParentId = target?.id ?? null;
      if (currentParentId === targetParentId) return;

      setNodes((nodes) => {
        const updated = nodes.map((n): Node => {
          if (n.id !== dragged.id) return n;
          if (target) {
            const targetAbs = absPos(target);
            return {
              ...n,
              parentId: target.id,
              extent: undefined,
              position: {
                x: dragAbs.x - targetAbs.x,
                y: dragAbs.y - targetAbs.y,
              },
            };
          }
          return { ...n, parentId: undefined, position: dragAbs };
        });

        // React Flow requires parents to appear before their children in the
        // array. If we just adopted `dragged`, make sure it comes after its
        // new parent.
        if (target) {
          const parentIdx = updated.findIndex((n) => n.id === target.id);
          const childIdx = updated.findIndex((n) => n.id === dragged.id);
          if (childIdx < parentIdx) {
            const [child] = updated.splice(childIdx, 1);
            updated.splice(parentIdx, 0, child);
          }
        }

        return updated;
      });
    },
    [rf, setNodes],
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "default",
      style: { stroke: "#94a3b8", strokeWidth: 2 },
      markerEnd: { type: "arrowclosed" as const, color: "#94a3b8" },
    }),
    [],
  );

  return (
    <div className="flex h-screen flex-col">
      <header className="bg-background flex items-center gap-2 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.navigate({ href: "/dashboard" })}
        >
          <ArrowLeft aria-hidden />
          Back
        </Button>
        <h1 className="flex-1 truncate text-sm font-medium">{project.name}</h1>
        <Button variant="outline" size="sm" onClick={addNote}>
          <StickyNote aria-hidden />
          Note
        </Button>
        <Button variant="outline" size="sm" onClick={addTodo}>
          <ListChecks aria-hidden />
          Todo
        </Button>
        <Button variant="outline" size="sm" onClick={addText}>
          <Type aria-hidden />
          Text
        </Button>
        <Button variant="outline" size="sm" onClick={addFrame}>
          <Frame aria-hidden />
          Frame
        </Button>
      </header>
      <div
        ref={wrapperRef}
        className="min-h-0 flex-1"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView={nodes.length > 0}
          colorMode="dark"
        >
          <Background gap={20} size={1} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
