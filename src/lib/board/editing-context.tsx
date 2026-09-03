import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

interface EditingContextValue {
	editingId: string | null;
	startEditing: (id: string) => void;
	stopEditing: () => void;
}

const EditingContext = createContext<EditingContextValue>({
	editingId: null,
	startEditing: () => {},
	stopEditing: () => {},
});

/**
 * Tracks which node is in edit mode.
 *
 * Lifted out of the individual nodes because edit mode can now be entered from
 * two places: a double-click on the node body, or Enter while the node has
 * keyboard focus. The keyboard path has to live on the board — React Flow owns
 * the focusable element (`.react-flow__node`), and a handler on the node's own
 * content div would never see the event, since focus sits on the ancestor.
 */
export function BoardEditingProvider({ children }: { children: ReactNode }) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const startEditing = useCallback((id: string) => setEditingId(id), []);
	const stopEditing = useCallback(() => setEditingId(null), []);

	const value = useMemo(
		() => ({ editingId, startEditing, stopEditing }),
		[editingId, startEditing, stopEditing],
	);

	return (
		<EditingContext.Provider value={value}>{children}</EditingContext.Provider>
	);
}

export function useBoardEditing() {
	return useContext(EditingContext);
}

/** Edit state for one node. */
export function useNodeEditing(id: string) {
	const { editingId, startEditing, stopEditing } = useBoardEditing();
	return useMemo(
		() => ({
			isEditing: editingId === id,
			startEditing: () => startEditing(id),
			stopEditing,
		}),
		[editingId, id, startEditing, stopEditing],
	);
}
