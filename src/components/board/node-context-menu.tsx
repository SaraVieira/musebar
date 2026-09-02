import type { Node } from "@xyflow/react";
import {
	ArrowDownToLine,
	ArrowUpToLine,
	Copy,
	Link as LinkIcon,
	Trash2,
} from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "#/lib/utils";
import { CARD_COLORS } from "./color-picker";

export interface NodeContextMenuState {
	x: number;
	y: number;
	node: Node;
}

interface Actions {
	onDuplicate: () => void;
	onDelete: () => void;
	onBringToFront: () => void;
	onSendToBack: () => void;
	onColor: (color: string) => void;
	onCopyLink: () => void;
	onClose: () => void;
}

export function NodeContextMenu({
	state,
	actions,
}: {
	state: NodeContextMenuState;
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

	const type = state.node.type ?? "";
	const isColorable = type === "note" || type === "todo";
	const hasUrl = type === "bookmark" || type === "embed";

	return createPortal(
		<div
			ref={menuRef}
			role="menu"
			style={{ left: state.x, top: state.y }}
			className="bg-popover text-popover-foreground fixed z-50 min-w-[180px] rounded-md border p-1 shadow-md"
		>
			<MenuItem
				icon={<Copy className="size-4" />}
				label="Duplicate"
				shortcut="⌘D"
				onClick={() => {
					actions.onDuplicate();
					actions.onClose();
				}}
			/>
			{hasUrl ? (
				<MenuItem
					icon={<LinkIcon className="size-4" />}
					label="Copy link"
					onClick={() => {
						actions.onCopyLink();
						actions.onClose();
					}}
				/>
			) : null}
			<MenuItem
				icon={<ArrowUpToLine className="size-4" />}
				label="Bring to front"
				onClick={() => {
					actions.onBringToFront();
					actions.onClose();
				}}
			/>
			<MenuItem
				icon={<ArrowDownToLine className="size-4" />}
				label="Send to back"
				onClick={() => {
					actions.onSendToBack();
					actions.onClose();
				}}
			/>
			{isColorable ? (
				<>
					<MenuDivider />
					<div className="flex gap-1 px-2 py-1.5">
						{CARD_COLORS.map((c) => (
							<button
								key={c.value}
								type="button"
								aria-label={c.name}
								title={c.name}
								onClick={() => {
									actions.onColor(c.value);
									actions.onClose();
								}}
								style={{ background: c.value }}
								className={cn(
									"size-5 cursor-pointer rounded-full border-0 p-0",
									c.value === "#ffffff" && "border border-black/15",
								)}
							/>
						))}
					</div>
				</>
			) : null}
			<MenuDivider />
			<MenuItem
				icon={<Trash2 className="size-4" />}
				label="Delete"
				shortcut="⌫"
				destructive
				onClick={() => {
					actions.onDelete();
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
	shortcut,
	destructive,
	onClick,
}: {
	icon: ReactNode;
	label: string;
	shortcut?: string;
	destructive?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			role="menuitem"
			onClick={onClick}
			className={cn(
				"hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
				destructive
					? "text-destructive hover:text-destructive"
					: "text-popover-foreground",
			)}
		>
			{icon}
			<span className="flex-1">{label}</span>
			{shortcut ? (
				<span className="text-muted-foreground text-xs">{shortcut}</span>
			) : null}
		</button>
	);
}

function MenuDivider() {
	return <div className="bg-border my-1 h-px" />;
}
