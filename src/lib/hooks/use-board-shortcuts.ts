import { useEffect, useRef } from "react";
import {
	CREATABLE_NODES,
	type CreatableNodeType,
} from "#/lib/board/node-types";
import { isEditableTarget } from "#/lib/utils";

interface Handlers {
	onAddNode: (type: CreatableNodeType) => void;
	onDuplicate: () => void;
	onOpenShortcuts: () => void;
}

export function useBoardShortcuts(handlers: Handlers) {
	// Callers pass a fresh object literal every render. Reading through a ref
	// keeps the effect's dependency list empty, so the window listener is bound
	// once instead of being torn down and re-added on every board render.
	const handlersRef = useRef(handlers);
	handlersRef.current = handlers;

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (isEditableTarget(e.target)) return;

			const meta = e.metaKey || e.ctrlKey;
			const key = e.key;

			if (meta && key === "/") {
				e.preventDefault();
				handlersRef.current.onOpenShortcuts();
				return;
			}
			if (meta && key.toLowerCase() === "d") {
				e.preventDefault();
				handlersRef.current.onDuplicate();
				return;
			}
			if (meta || e.altKey) return;

			if (key === "?") {
				e.preventDefault();
				handlersRef.current.onOpenShortcuts();
				return;
			}
			const creatable = CREATABLE_NODES.find(
				(n) => n.shortcut === key.toLowerCase(),
			);
			if (creatable) {
				e.preventDefault();
				handlersRef.current.onAddNode(creatable.type);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
}
