import type { Node, NodeProps } from "@xyflow/react";
import { BoardResizer } from "../board-resizer";
import { NodeHandles } from "../node-handles";
import { Skeleton } from "../node-progress";

interface BookmarkNodeData {
	url: string;
	title: string;
	description: string;
	image: string;
	favicon: string;
	pending?: boolean;
	failed?: boolean;
	[key: string]: unknown;
}

export type BookmarkNode = Node<BookmarkNodeData, "bookmark">;

export function BookmarkNodeView({
	data,
	selected,
	width,
	height,
}: NodeProps<BookmarkNode>) {
	const hostname = safeHost(data.url);
	return (
		<div className="group relative size-full" style={{ width, height }}>
			<BoardResizer minWidth={220} minHeight={120} selected={selected} />
			<a
				href={data.url}
				target="_blank"
				rel="noopener noreferrer"
				onPointerDown={(e) => e.stopPropagation()}
				className="flex size-full flex-col overflow-hidden rounded-xl bg-white text-gray-800 no-underline shadow-md"
			>
				{data.pending ? (
					<Skeleton className="h-1/2 w-full rounded-none" />
				) : data.image ? (
					// object-contain so a preview is never silently cropped, matching
					// image nodes. og:images are typically 1.91:1 while this strip is
					// wider, so the tinted band is what the letterboxing lands on.
					<img
						src={data.image}
						alt=""
						className="h-1/2 w-full bg-gray-100 object-contain"
						draggable={false}
					/>
				) : (
					<div className="h-1/2 w-full bg-gray-100" />
				)}
				<div className="flex flex-1 flex-col gap-1 p-3">
					<div className="line-clamp-2 text-sm font-semibold">
						{data.title || hostname}
					</div>
					{data.pending ? (
						<div className="mt-1 flex flex-col gap-1.5">
							<Skeleton className="h-2.5 w-full" />
							<Skeleton className="h-2.5 w-4/5" />
						</div>
					) : data.description ? (
						<div className="text-muted-foreground line-clamp-2 text-xs">
							{data.description}
						</div>
					) : data.failed ? (
						<div className="text-xs text-gray-400">Preview unavailable</div>
					) : null}
					<div className="mt-auto flex items-center gap-1.5 text-xs text-gray-500">
						{data.favicon ? (
							<img src={data.favicon} alt="" className="size-3.5" />
						) : null}
						<span className="truncate">{hostname}</span>
					</div>
				</div>
			</a>
			<NodeHandles />
		</div>
	);
}

function safeHost(url: string) {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
}
