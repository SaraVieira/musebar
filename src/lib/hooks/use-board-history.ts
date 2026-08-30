import { useCallback, useEffect } from "react";
import { useReactFlow, type Edge, type Node } from "@xyflow/react";
import { useHistory } from "./use-history";

type Snapshot = { nodes: Node[]; edges: Edge[] };
type SetNodes = (updater: Node[] | ((n: Node[]) => Node[])) => void;
type SetEdges = (updater: Edge[] | ((e: Edge[]) => Edge[])) => void;

function isEditableTarget(t: EventTarget | null) {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA";
}

export function useBoardHistory(setNodes: SetNodes, setEdges: SetEdges) {
  const rf = useReactFlow();
  const history = useHistory<Snapshot>();

  const snapshot = useCallback(
    (): Snapshot => ({ nodes: rf.getNodes(), edges: rf.getEdges() }),
    [rf],
  );

  // Commit the current state to history — call BEFORE a mutation so undo
  // restores the pre-mutation state.
  const commit = useCallback(() => history.commit(snapshot()), [history, snapshot]);

  const undo = useCallback(() => {
    const prev = history.undo(snapshot());
    if (!prev) return;
    setNodes(prev.nodes);
    setEdges(prev.edges);
  }, [history, snapshot, setNodes, setEdges]);

  const redo = useCallback(() => {
    const next = history.redo(snapshot());
    if (!next) return;
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [history, snapshot, setNodes, setEdges]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;
      const key = e.key.toLowerCase();
      if (key !== "z" && key !== "y") return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      if (key === "y" || (key === "z" && e.shiftKey)) redo();
      else undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return {
    commit,
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
