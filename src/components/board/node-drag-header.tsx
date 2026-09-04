import { GripHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

interface NodeDragHeaderProps {
	handleClass: string;
	className?: string;
	children?: ReactNode;
	gripFirst?: boolean;
}

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
