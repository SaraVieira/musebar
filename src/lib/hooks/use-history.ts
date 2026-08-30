import { useCallback, useRef, useState } from "react";

export function useHistory<T>(limit = 100) {
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [, force] = useState(0);
  const refresh = useCallback(() => force((n) => n + 1), []);

  const commit = useCallback(
    (state: T) => {
      past.current.push(state);
      if (past.current.length > limit) past.current.shift();
      future.current = [];
      refresh();
    },
    [limit, refresh],
  );

  const undo = useCallback(
    (current: T): T | null => {
      const prev = past.current.pop();
      if (!prev) return null;
      future.current.push(current);
      if (future.current.length > limit) future.current.shift();
      refresh();
      return prev;
    },
    [limit, refresh],
  );

  const redo = useCallback(
    (current: T): T | null => {
      const next = future.current.pop();
      if (!next) return null;
      past.current.push(current);
      if (past.current.length > limit) past.current.shift();
      refresh();
      return next;
    },
    [limit, refresh],
  );

  const reset = useCallback(() => {
    past.current = [];
    future.current = [];
    refresh();
  }, [refresh]);

  return {
    commit,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
