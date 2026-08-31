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
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import type { Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Keyboard, Redo2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { BoardHistoryProvider } from "#/lib/board/history-context";
import { ShortcutsDialog } from "#/components/board/shortcuts-dialog";
import { BoardSettingsButton } from "#/components/board/board-settings";
import { EditProjectDialog } from "#/components/dashboard/edit-project-dialog";
import { ExportMenu } from "#/components/board/export-menu";
import { BackgroundVariant } from "@xyflow/react";
import { Button } from "#/components/ui/button";
import { BoardSidebar } from "#/components/board/board-sidebar";
import {
  NodeContextMenu,
  type NodeContextMenuState,
} from "#/components/board/node-context-menu";
import {
  PaneContextMenu,
  type PaneContextMenuState,
} from "#/components/board/pane-context-menu";
import { UrlDialog } from "#/components/board/url-dialog";
import { BookmarkNodeView } from "#/components/board/nodes/bookmark-node";
import { EmbedNodeView } from "#/components/board/nodes/embed-node";
import { FileNodeView } from "#/components/board/nodes/file-node";
import { FrameNodeView } from "#/components/board/nodes/frame-node";
import { ImageNodeView } from "#/components/board/nodes/image-node";
import { NoteNodeView } from "#/components/board/nodes/note";
import { TextNodeView } from "#/components/board/nodes/text-node";
import { TodoNodeView } from "#/components/board/nodes/todo-node";
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
import { useBoardShortcuts } from "#/lib/hooks/use-board-shortcuts";
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
  const [paneMenu, setPaneMenu] = useState<PaneContextMenuState | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const preDragSnapshot = useRef<{
    nodes: Node[];
    edges: Edge[];
    positions: Map<string, { x: number; y: number }>;
  } | null>(null);
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    settings,
    updateSettings,
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
  // Skip the commit if the drag didn't actually move anything (a click on a
  // node still fires drag start/stop), so undo doesn't get no-op entries.
  const onNodeDragStart = useCallback(() => {
    const snap = history.snapshot();
    const positions = new Map(snap.nodes.map((n) => [n.id, { ...n.position }]));
    preDragSnapshot.current = { ...snap, positions };
  }, [history]);
  const onNodeDragStop = useCallback<typeof rawOnNodeDragStop>(
    (e, node, ns) => {
      const before = preDragSnapshot.current;
      preDragSnapshot.current = null;
      if (before) {
        const after = rf.getNodes();
        const moved = after.some((n) => {
          const p = before.positions.get(n.id);
          return p && (p.x !== n.position.x || p.y !== n.position.y);
        });
        if (moved) {
          history.commitSnapshot({ nodes: before.nodes, edges: before.edges });
        }
      }
      rawOnNodeDragStop(e, node, ns);
    },
    [history, rf, rawOnNodeDragStop],
  );
  const onConnectWithHistory = useCallback<typeof onConnect>(
    (params) => {
      history.commit();
      onConnect(params);
    },
    [history, onConnect],
  );

  const addNoteAt = useCallback(
    (at: { x: number; y: number }) => {
      history.commit();
      setNodes((ns) => [...ns, makeNoteNode(at)]);
    },
    [history, setNodes],
  );
  const addTodoAt = useCallback(
    (at: { x: number; y: number }) => {
      history.commit();
      setNodes((ns) => [...ns, makeTodoNode(at)]);
    },
    [history, setNodes],
  );
  const addTextAt = useCallback(
    (at: { x: number; y: number }) => {
      history.commit();
      setNodes((ns) => [...ns, makeTextNode(at)]);
    },
    [history, setNodes],
  );
  const addFrameAt = useCallback(
    (at: { x: number; y: number }) => {
      history.commit();
      setNodes((ns) => [makeFrameNode(at), ...ns]);
    },
    [history, setNodes],
  );

  const addNote = useCallback(
    () => addNoteAt(boardCenter()),
    [addNoteAt, boardCenter],
  );
  const addTodo = useCallback(
    () => addTodoAt(boardCenter()),
    [addTodoAt, boardCenter],
  );
  const addText = useCallback(
    () => addTextAt(boardCenter()),
    [addTextAt, boardCenter],
  );
  const addFrame = useCallback(
    () => addFrameAt(boardCenter()),
    [addFrameAt, boardCenter],
  );

  const duplicate = useCallback(
    (nodeId?: string) => {
      const source = nodeId
        ? [rf.getNode(nodeId)].filter((n): n is NonNullable<typeof n> => !!n)
        : rf.getNodes().filter((n) => n.selected);
      if (source.length === 0) return;
      history.commit();
      const sourceEdges = rf.getEdges();
      const clones = duplicateNodes(source, sourceEdges);
      setNodes((ns) => [
        ...ns.map((n) => ({ ...n, selected: false })),
        ...clones.nodes,
      ]);
      if (clones.edges.length > 0) {
        setEdges((es) => [
          ...es.map((e) => ({ ...e, selected: false })),
          ...clones.edges,
        ]);
      }
    },
    [rf, history, setNodes, setEdges],
  );

  useBoardShortcuts({
    onAddNote: addNote,
    onAddTodo: addTodo,
    onAddText: addText,
    onAddFrame: addFrame,
    onDuplicate: () => duplicate(),
    onOpenShortcuts: () => setShortcutsOpen(true),
  });

  const bringToFront = useCallback(
    (nodeId: string) => {
      history.commit();
      setNodes((ns) => {
        const max = Math.max(0, ...ns.map((n) => n.zIndex ?? 0));
        return ns.map((n) => (n.id === nodeId ? { ...n, zIndex: max + 1 } : n));
      });
    },
    [history, setNodes],
  );

  const sendToBack = useCallback(
    (nodeId: string) => {
      history.commit();
      setNodes((ns) => {
        // React Flow's Background sits at zIndex -1; anything below 0 vanishes.
        // Push target below every other node, then normalize so min is 0.
        const others = ns.filter((n) => n.id !== nodeId);
        const minOther = others.length
          ? Math.min(...others.map((n) => n.zIndex ?? 0))
          : 0;
        const targetZ = minOther - 1;
        const overallMin = Math.min(targetZ, minOther);
        const shift = overallMin < 0 ? -overallMin : 0;
        return ns.map((n) => {
          const base = n.id === nodeId ? targetZ : (n.zIndex ?? 0);
          return { ...n, zIndex: base + shift };
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

  const copyLink = useCallback((node: Node) => {
    const d = node.data as Record<string, unknown>;
    const url =
      typeof d.url === "string"
        ? d.url
        : typeof d.src === "string"
          ? d.src
          : "";
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Couldn't copy link"));
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
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="hover:bg-accent min-w-0 flex-1 truncate rounded px-2 py-1 text-left text-sm font-medium"
            title="Rename project"
          >
            {project.name}
          </button>
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
          <Button
            variant="ghost"
            size="icon"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (⌘/)"
            onClick={() => setShortcutsOpen(true)}
          >
            <Keyboard aria-hidden />
          </Button>
          <ExportMenu projectName={project.name} />
          <BoardSettingsButton settings={settings} onChange={updateSettings} />
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
                setPaneMenu(null);
                setContextMenu({ x: e.clientX, y: e.clientY, node });
              }}
              onPaneContextMenu={(e) => {
                e.preventDefault();
                setContextMenu(null);
                setPaneMenu({ x: e.clientX, y: e.clientY });
              }}
              onPaneClick={() => {
                setContextMenu(null);
                setPaneMenu(null);
              }}
              onMove={() => {
                setContextMenu(null);
                setPaneMenu(null);
              }}
              onBeforeDelete={async () => {
                history.commit();
                return true;
              }}
              defaultEdgeOptions={defaultEdgeOptions}
              fitView={nodes.length > 0}
              minZoom={0.1}
              maxZoom={2.5}
              colorMode="dark"
              snapToGrid={settings.snap}
              snapGrid={[settings.gridSize, settings.gridSize]}
            >
              {settings.bgVariant !== "none" ? (
                <Background
                  variant={settings.bgVariant as unknown as BackgroundVariant}
                  color={settings.bgColor}
                  gap={settings.gridSize}
                  size={1}
                />
              ) : null}
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
        <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
        <EditProjectDialog
          project={{
            id: project.id,
            name: project.name,
            description: project.description ?? null,
          }}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={() => router.invalidate()}
        />
        {paneMenu ? (
          <PaneContextMenu
            state={paneMenu}
            actions={{
              onAddNote: () =>
                addNoteAt(
                  rf.screenToFlowPosition({ x: paneMenu.x, y: paneMenu.y }),
                ),
              onAddTodo: () =>
                addTodoAt(
                  rf.screenToFlowPosition({ x: paneMenu.x, y: paneMenu.y }),
                ),
              onAddText: () =>
                addTextAt(
                  rf.screenToFlowPosition({ x: paneMenu.x, y: paneMenu.y }),
                ),
              onAddFrame: () =>
                addFrameAt(
                  rf.screenToFlowPosition({ x: paneMenu.x, y: paneMenu.y }),
                ),
              onAddUrl: () => setUrlOpen(true),
              onClose: () => setPaneMenu(null),
            }}
          />
        ) : null}
      </div>
    </BoardHistoryProvider>
  );
}
