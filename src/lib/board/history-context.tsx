import { createContext, useContext, type ReactNode } from "react";

interface BoardHistoryContextValue {
  commit: () => void;
}

const BoardHistoryContext = createContext<BoardHistoryContextValue>({
  commit: () => {},
});

export function BoardHistoryProvider({
  commit,
  children,
}: {
  commit: () => void;
  children: ReactNode;
}) {
  return (
    <BoardHistoryContext.Provider value={{ commit }}>
      {children}
    </BoardHistoryContext.Provider>
  );
}

// Nodes call this before applying a mutation so undo restores the
// pre-mutation state. For text fields the convention is: call on focus
// (capturing the "before" state), so one focused edit session collapses to
// a single undo step.
export function useBoardCommit() {
  return useContext(BoardHistoryContext).commit;
}
