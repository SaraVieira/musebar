import { useCallback, useRef } from "react";
import { useBoardCommit } from "#/lib/board/history-context";

export function useCommitOnFirstEdit() {
  const commit = useBoardCommit();
  const committedThisFocus = useRef(false);

  const onFocus = useCallback(() => {
    committedThisFocus.current = false;
  }, []);

  const onBeforeInput = useCallback(() => {
    if (committedThisFocus.current) return;
    commit();
    committedThisFocus.current = true;
  }, [commit]);

  const onBlur = useCallback(() => {
    committedThisFocus.current = false;
  }, []);

  return { onFocus, onBeforeInput, onBlur };
}
