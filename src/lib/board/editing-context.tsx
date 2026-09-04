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
