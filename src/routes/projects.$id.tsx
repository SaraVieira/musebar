import { useCallback, useMemo, useRef, useState } from "react";
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
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft } from "lucide-react";
import { Button } from "#/components/ui/button";
import { BoardSidebar } from "#/components/board/board-sidebar";
import { UrlDialog } from "#/components/board/url-dialog";
import { BookmarkNodeView } from "#/components/board/bookmark-node";
import { EmbedNodeView } from "#/components/board/embed-node";
import { FileNodeView } from "#/components/board/file-node";
import { FrameNodeView } from "#/components/board/frame-node";
import { ImageNodeView } from "#/components/board/image-node";
import { NoteNodeView } from "#/components/board/note";
import { TextNodeView } from "#/components/board/text-node";
import { TodoNodeView } from "#/components/board/todo-node";
import { getSession } from "#/lib/auth-server";
import { getProject } from "#/lib/projects-server";
import {
  makeFrameNode,
  makeNoteNode,
  makeTextNode,
  makeTodoNode,
} from "#/lib/board/factories";
import { useAddByUrl } from "#/lib/hooks/use-add-by-url";
import { useAddFiles } from "#/lib/hooks/use-add-files";
import { useBoard } from "#/lib/hooks/use-board";
import { useBoardPaste } from "#/lib/hooks/use-board-paste";
import { useFrameParenting } from "#/lib/hooks/use-frame-parenting";

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
  const [urlOpen, setUrlOpen] = useState(false);
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

  const addByUrl = useAddByUrl(setNodes);
  const addFiles = useAddFiles(setNodes, uploadFile);
  const onNodeDragStop = useFrameParenting(setNodes);

  const addNote = useCallback(
    () => setNodes((ns) => [...ns, makeNoteNode(boardCenter())]),
    [boardCenter, setNodes],
  );
  const addTodo = useCallback(
    () => setNodes((ns) => [...ns, makeTodoNode(boardCenter())]),
    [boardCenter, setNodes],
  );
  const addText = useCallback(
    () => setNodes((ns) => [...ns, makeTextNode(boardCenter())]),
    [boardCenter, setNodes],
  );
  const addFrame = useCallback(
    () => setNodes((ns) => [makeFrameNode(boardCenter()), ...ns]),
    [boardCenter, setNodes],
  );

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const at = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) return addFiles(files, at);
      const url =
        e.dataTransfer?.getData("text/uri-list") ||
        e.dataTransfer?.getData("text/plain");
      if (url && /^https?:\/\//i.test(url.trim())) {
        return addByUrl(url.trim().split(/\s+/)[0], at);
      }
    },
    [rf, addFiles, addByUrl],
  );

  useBoardPaste({ getCenter: boardCenter, onFiles: addFiles, onUrl: addByUrl });

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
      </header>
      <div className="flex min-h-0 flex-1">
        <BoardSidebar
          onAddNote={addNote}
          onAddTodo={addTodo}
          onAddText={addText}
          onAddFrame={addFrame}
          onAddUrl={() => setUrlOpen(true)}
          onAddFiles={(files) => addFiles(files, boardCenter())}
        />
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
            minZoom={0.1}
            maxZoom={2.5}
            colorMode="dark"
          >
            <Background gap={20} size={1} />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </div>
      </div>
      <UrlDialog
        open={urlOpen}
        onOpenChange={setUrlOpen}
        onSubmit={(url) => addByUrl(url, boardCenter())}
      />
    </div>
  );
}
