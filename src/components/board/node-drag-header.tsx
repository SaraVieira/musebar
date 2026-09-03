import { GripHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

interface NodeDragHeaderProps {
	/**
	 * The node type's drag-handle class. Each type keeps its own because the
	 * selector is persisted in saved boards as `node.dragHandle`; unifying them
	 * would break dragging on every board saved before the change.
	 */
	handleClass: string;
	className?: string;
	/** Rendered before the grip, so the grip can sit at either end. */
	children?: ReactNode;
	gripFirst?: boolean;
}

/**
 * The grab bar on nodes whose body swallows pointer events (iframes, canvases),
 * which otherwise could not be dragged at all.
 */
export function NodeDragHeader({
	handleClass,
	className,
	children,
	gripFirst = true,
}: NodeDragHeaderProps) {
	const grip = <GripHorizontal aria-hidden className="size-3.5 shrink-0" />;
	return (
		<div
			className={cn(
				handleClass,
				"flex shrink-0 cursor-grab items-center bg-neutral-950 text-gray-400",
				className,
			)}
			title="Drag to move"
		>
			{gripFirst ? grip : null}
			{children}
			{gripFirst ? null : grip}
		</div>
	);
}
