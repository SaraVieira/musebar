import { Link2 } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
	CREATABLE_NODES,
	type CreatableNodeType,
} from "#/lib/board/node-types";
import { cn } from "#/lib/utils";
import { CREATABLE_NODE_ICONS } from "./nodes/registry";

export interface PaneContextMenuState {
	x: number;
	y: number;
}

interface Actions {
	onAddNode: (type: CreatableNodeType) => void;
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
			{CREATABLE_NODES.map(({ type, label }) => {
				const Icon = CREATABLE_NODE_ICONS[type];
				return (
					<MenuItem
						key={type}
						icon={<Icon className="size-4" />}
						label={`New ${label.toLowerCase()}`}
						onClick={() => {
							actions.onAddNode(type);
							actions.onClose();
						}}
					/>
				);
			})}
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
