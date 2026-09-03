import { useEffect } from "react";
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
			const creatable = CREATABLE_NODES.find(
				(n) => n.shortcut === key.toLowerCase(),
			);
			if (creatable) {
				e.preventDefault();
				handlers.onAddNode(creatable.type);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [handlers]);
}
