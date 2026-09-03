import { useEffect } from "react";
import { isEditableTarget } from "#/lib/utils";

interface Handlers {
	onAddNote: () => void;
	onAddTodo: () => void;
	onAddText: () => void;
	onAddFrame: () => void;
	onDuplicate: () => void;
	onOpenShortcuts: () => void;
}

export function useBoardShortcuts(handlers: Handlers) {
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (isEditableTarget(e.target)) return;

			const meta = e.metaKey || e.ctrlKey;
			const key = e.key;

			if (meta && key === "/") {
				e.preventDefault();
				handlers.onOpenShortcuts();
				return;
			}
			if (meta && key.toLowerCase() === "d") {
				e.preventDefault();
				handlers.onDuplicate();
				return;
			}
			if (meta || e.altKey) return;

			if (key === "?") {
				e.preventDefault();
				handlers.onOpenShortcuts();
				return;
			}
			switch (key.toLowerCase()) {
				case "n":
					e.preventDefault();
					handlers.onAddNote();
					break;
				case "t":
					e.preventDefault();
					handlers.onAddTodo();
					break;
				case "x":
					e.preventDefault();
					handlers.onAddText();
					break;
				case "f":
					e.preventDefault();
					handlers.onAddFrame();
					break;
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [handlers]);
}
