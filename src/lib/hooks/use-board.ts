import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  useEdgesState,
  useNodesState,
  useReactFlow,
  addEdge,
  type Edge,
  type Node,
  type OnConnect,
  type Connection,
} from "@xyflow/react";
import { getProject, updateProjectContent } from "#/lib/projects-server";
import { readImageDims } from "#/lib/media-dims";

type Project = NonNullable<Awaited<ReturnType<typeof getProject>>>;

const SAVE_DEBOUNCE_MS = 800;

async function uploadFile(file: File, projectId: string) {
  const form = new FormData();
  form.set("file", file);
  form.set("projectId", projectId);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as { id: string; src: string; mimeType: string };
}

function parseSnapshot(raw: string | null): {
  nodes: Node[];
  edges: Edge[];
} {
  if (!raw) return { nodes: [], edges: [] };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return { nodes: parsed.nodes, edges: parsed.edges };
    }
  } catch {}
  return { nodes: [], edges: [] };
}

export function useBoard(project: Project) {
  const initial = useMemo(() => parseSnapshot(project.content), [project.id]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void updateProjectContent({
        data: { id: project.id, content: JSON.stringify({ nodes, edges }) },
      });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [nodes, edges, project.id]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    uploadFile: (file: File) => uploadFile(file, project.id),
    readImageDims,
  };
}

export function useAddNode() {
  const { setNodes, screenToFlowPosition } = useReactFlow();
  return useCallback(
    (node: Node, atScreen?: { x: number; y: number }) => {
      const position = atScreen
        ? screenToFlowPosition(atScreen)
        : node.position;
      setNodes((ns) => [...ns, { ...node, position }]);
    },
    [setNodes, screenToFlowPosition],
  );
}
