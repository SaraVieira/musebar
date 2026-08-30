import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ArrowLeft, Redo2, Undo2 } from "lucide-react";
import { BoardHistoryProvider } from "#/lib/board/history-context";
import { Button } from "#/components/ui/button";
import { BoardSidebar } from "#/components/board/board-sidebar";
import {
  NodeContextMenu,
  type NodeContextMenuState,
} from "#/components/board/node-context-menu";
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
import { duplicateNodes } from "#/lib/board/duplicate";
import {
  makeFrameNode,
  makeNoteNode,
  makeTextNode,
  makeTodoNode,
} from "#/lib/board/factories";
import { useAddByUrl } from "#/lib/hooks/use-add-by-url";
import { useAddFiles } from "#/lib/hooks/use-add-files";
import { useBoard } from "#/lib/hooks/use-board";
import { useBoardHistory } from "#/lib/hooks/use-board-history";
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
  const [contextMenu, setContextMenu] = useState<NodeContextMenuState | null>(
    null,
  );
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    uploadFile,
  } = useBoard(project);
  const rf = useReactFlow();
  const history = useBoardHistory(setNodes, setEdges);

  const boardCenter = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return rf.screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, [rf]);

  const rawAddByUrl = useAddByUrl(setNodes);
  const rawAddFiles = useAddFiles(setNodes, uploadFile);
  const rawOnNodeDragStop = useFrameParenting(setNodes);

  const addByUrl = useCallback(
    (url: string, at: { x: number; y: number }) => {
      history.commit();
      return rawAddByUrl(url, at);
    },
    [history, rawAddByUrl],
  );
  const addFiles = useCallback(
    (files: File[], at: { x: number; y: number }) => {
      history.commit();
      return rawAddFiles(files, at);
    },
    [history, rawAddFiles],
  );
  const onNodeDragStart = useCallback(() => {
    history.commit();
  }, [history]);
  const onNodeDragStop = useCallback<typeof rawOnNodeDragStop>(
    (e, node, ns) => {
      rawOnNodeDragStop(e, node, ns);
    },
    [rawOnNodeDragStop],
  );
  const onConnectWithHistory = useCallback<typeof onConnect>(
    (params) => {
      history.commit();
      onConnect(params);
    },
    [history, onConnect],
  );

  const addNote = useCallback(() => {
    history.commit();
    setNodes((ns) => [...ns, makeNoteNode(boardCenter())]);
  }, [history, boardCenter, setNodes]);
  const addTodo = useCallback(() => {
    history.commit();
    setNodes((ns) => [...ns, makeTodoNode(boardCenter())]);
  }, [history, boardCenter, setNodes]);
  const addText = useCallback(() => {
    history.commit();
    setNodes((ns) => [...ns, makeTextNode(boardCenter())]);
  }, [history, boardCenter, setNodes]);
  const addFrame = useCallback(() => {
    history.commit();
    setNodes((ns) => [makeFrameNode(boardCenter()), ...ns]);
  }, [history, boardCenter, setNodes]);

  // Duplicate the current selection (or a specific node if provided).
  const duplicate = useCallback(
    (nodeId?: string) => {
      const source = nodeId
        ? [rf.getNode(nodeId)].filter((n): n is NonNullable<typeof n> => !!n)
        : rf.getNodes().filter((n) => n.selected);
      if (source.length === 0) return;
      history.commit();
      const clones = duplicateNodes(source);
      setNodes((ns) => [
        ...ns.map((n) => ({ ...n, selected: false })),
        ...clones,
      ]);
    },
    [rf, history, setNodes],
  );

  // Cmd/Ctrl+D duplicates the current selection.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() !== "d") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /INPUT|TEXTAREA/.test(t.tagName))) return;
      e.preventDefault();
      duplicate();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duplicate]);

  const bringToFront = useCallback(
    (nodeId: string) => {
      history.commit();
      setNodes((ns) => {
        const max = Math.max(0, ...ns.map((n) => n.zIndex ?? 0));
        return ns.map((n) =>
          n.id === nodeId ? { ...n, zIndex: max + 1 } : n,
        );
      });
    },
    [history, setNodes],
  );

  const sendToBack = useCallback(
    (nodeId: string) => {
      history.commit();
      setNodes((ns) => {
        const others = ns.filter((n) => n.id !== nodeId);
        const minOther = Math.min(0, ...others.map((n) => n.zIndex ?? 0));
        // Keep the target at 0 (React Flow's Background sits at -1). If any
        // other node is already at 0 or below, bump everyone else up so the
        // target can sit at 0 alone.
        if (minOther > 0) {
          return ns.map((n) =>
            n.id === nodeId ? { ...n, zIndex: 0 } : n,
          );
        }
        return ns.map((n) => {
          if (n.id === nodeId) return { ...n, zIndex: 0 };
          return { ...n, zIndex: (n.zIndex ?? 0) + 1 };
        });
      });
    },
    [history, setNodes],
  );

  const setNodeColor = useCallback(
    (nodeId: string, color: string) => {
      history.commit();
      rf.updateNodeData(nodeId, { color });
    },
    [history, rf],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      history.commit();
      setNodes((ns) => ns.filter((n) => n.id !== nodeId));
    },
    [history, setNodes],
  );

  const copyLink = useCallback((node: import("@xyflow/react").Node) => {
    const d = node.data as Record<string, unknown>;
    const url =
      typeof d.url === "string"
        ? d.url
        : typeof d.src === "string"
          ? d.src
          : "";
    if (url) void navigator.clipboard.writeText(url);
  }, []);

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
    <BoardHistoryProvider commit={history.commit}>
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
        <Button
          variant="ghost"
          size="icon"
          aria-label="Undo"
          title="Undo (⌘Z)"
          disabled={!history.canUndo}
          onClick={history.undo}
        >
          <Undo2 aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Redo"
          title="Redo (⇧⌘Z)"
          disabled={!history.canRedo}
          onClick={history.redo}
        >
          <Redo2 aria-hidden />
        </Button>
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
            onConnect={onConnectWithHistory}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            onReconnectStart={history.commit}
            onNodeContextMenu={(e, node) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, node });
            }}
            onPaneClick={() => setContextMenu(null)}
            onMove={() => setContextMenu(null)}
            onBeforeDelete={async () => {
              history.commit();
              return true;
            }}
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
      {contextMenu ? (
        <NodeContextMenu
          state={contextMenu}
          actions={{
            onDuplicate: () => duplicate(contextMenu.node.id),
            onDelete: () => deleteNode(contextMenu.node.id),
            onBringToFront: () => bringToFront(contextMenu.node.id),
            onSendToBack: () => sendToBack(contextMenu.node.id),
            onColor: (c) => setNodeColor(contextMenu.node.id, c),
            onCopyLink: () => copyLink(contextMenu.node),
            onClose: () => setContextMenu(null),
          }}
        />
      ) : null}
    </div>
    </BoardHistoryProvider>
  );
}
