import { useCallback } from "react";
import {
  useReactFlow,
  type Node,
  type OnNodeDrag,
} from "@xyflow/react";

type SetNodes = (updater: (nodes: Node[]) => Node[]) => void;

// When a card is dropped inside a frame, adopt it as a child of that frame.
// When dragged out, detach and restore absolute position. Frames themselves
// are never re-parented (avoids nested frames).
export function useFrameParenting(setNodes: SetNodes): OnNodeDrag {
  const rf = useReactFlow();

  return useCallback(
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
        // array. If we just adopted `dragged`, reorder if needed.
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
}
