import { Frame, Link2, ListChecks, StickyNote, Type } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "#/lib/utils";

export interface PaneContextMenuState {
	x: number;
	y: number;
}

interface Actions {
	onAddNote: () => void;
	onAddTodo: () => void;
	onAddText: () => void;
	onAddFrame: () => void;
	onAddUrl: () => void;
	onClose: () => void;
}

export function PaneContextMenu({
	state,
	actions,
}: {
	state: PaneContextMenuState;
	actions: Actions;
}) {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function onDown(e: PointerEvent) {
			if (menuRef.current?.contains(e.target as globalThis.Node | null)) return;
			actions.onClose();
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") actions.onClose();
		}
		document.addEventListener("pointerdown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("pointerdown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [actions]);

	return createPortal(
		<div
			ref={menuRef}
			role="menu"
			style={{ left: state.x, top: state.y }}
			className="bg-popover text-popover-foreground fixed z-50 min-w-[180px] rounded-md border p-1 shadow-md"
		>
			<MenuItem
				icon={<StickyNote className="size-4" />}
				label="New note"
				onClick={() => {
					actions.onAddNote();
					actions.onClose();
				}}
			/>
			<MenuItem
				icon={<ListChecks className="size-4" />}
				label="New todo list"
				onClick={() => {
					actions.onAddTodo();
					actions.onClose();
				}}
			/>
			<MenuItem
				icon={<Type className="size-4" />}
				label="New text"
				onClick={() => {
					actions.onAddText();
					actions.onClose();
				}}
			/>
			<MenuItem
				icon={<Frame className="size-4" />}
				label="New frame"
				onClick={() => {
					actions.onAddFrame();
					actions.onClose();
				}}
			/>
			<MenuDivider />
			<MenuItem
				icon={<Link2 className="size-4" />}
				label="Add link"
				onClick={() => {
					actions.onAddUrl();
					actions.onClose();
				}}
			/>
		</div>,
		document.body,
	);
}

function MenuItem({
	icon,
	label,
	onClick,
}: {
	icon: ReactNode;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			role="menuitem"
			onClick={onClick}
			className={cn(
				"hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
			)}
		>
			{icon}
			<span className="flex-1">{label}</span>
		</button>
	);
}

function MenuDivider() {
	return <div className="bg-border my-1 h-px" />;
}
