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

export function useBoardCommit() {
  return useContext(BoardHistoryContext).commit;
}
