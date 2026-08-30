import { useCallback, useMemo, useRef } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, ListChecks, StickyNote } from "lucide-react";
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
import { useBoard } from "#/lib/hooks/use-board";
import { readImageDims } from "#/lib/media-dims";

const nodeTypes: NodeTypes = {
  note: NoteNodeView,
  todo: TodoNodeView,
  file: FileNodeView,
  image: ImageNodeView,
  bookmark: BookmarkNodeView,
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

  const projectCenter = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return rf.screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, [rf]);

  const addNote = useCallback(() => {
    const { x, y } = projectCenter();
    const node: NoteNode = {
      id: crypto.randomUUID(),
      type: "note",
      position: { x: x - 120, y: y - 80 },
      width: 240,
      height: 160,
      data: {},
    };
    setNodes((ns) => [...ns, node]);
  }, [projectCenter, setNodes]);

  const addTodo = useCallback(() => {
    const { x, y } = projectCenter();
    const node: TodoNode = {
      id: crypto.randomUUID(),
      type: "todo",
      position: { x: x - 130, y: y - 100 },
      width: 260,
      height: 200,
      data: { items: [{ id: crypto.randomUUID(), text: "", done: false }] },
    };
    setNodes((ns) => [...ns, node]);
  }, [projectCenter, setNodes]);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const drop = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });

      const files = Array.from(e.dataTransfer?.files ?? []);
      const url = e.dataTransfer?.getData("text/uri-list")
        || e.dataTransfer?.getData("text/plain");

      if (files.length > 0) {
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
                  x: drop.x - (w * scale) / 2 + offset,
                  y: drop.y - (h * scale) / 2 + offset,
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
                position: { x: drop.x - 120 + offset, y: drop.y - 48 + offset },
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
        return;
      }

      if (url && /^https?:\/\//i.test(url.trim())) {
        const cleaned = url.trim().split(/\s+/)[0];
        try {
          const meta = await fetchLinkMetadata({ data: { url: cleaned } });
          const node: BookmarkNode = {
            id: crypto.randomUUID(),
            type: "bookmark",
            position: { x: drop.x - 140, y: drop.y - 100 },
            width: 280,
            height: 220,
            data: {
              url: cleaned,
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
      }
    },
    [rf, uploadFile, setNodes],
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
      <header className="bg-background flex items-center gap-3 border-b px-4 py-3">
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
          defaultEdgeOptions={defaultEdgeOptions}
          fitView={nodes.length > 0}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="#e5e7eb" />
          <MiniMap pannable zoomable className="!bg-white/80" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
