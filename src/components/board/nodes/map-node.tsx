import { type Node, type NodeProps, NodeResizer } from "@xyflow/react";
import { ExternalLink, MapPin } from "lucide-react";
import { useBoardCommit } from "#/lib/board/history-context";
import { NodeHandles } from "../node-handles";

interface MapNodeData {
	url: string;
	mapSrc: string;
	title: string;
	address: string;
	[key: string]: unknown;
}

export type MapNode = Node<MapNodeData, "map">;

export function MapNodeView({
	data,
	selected,
	width,
	height,
}: NodeProps<MapNode>) {
	const commit = useBoardCommit();
	return (
		<div className="group relative size-full" style={{ width, height }}>
			<NodeResizer
				minWidth={260}
				minHeight={220}
				isVisible={selected}
				onResizeStart={commit}
				lineClassName="!border-gray-900/40"
				handleClassName="!bg-white !border !border-gray-900/40 !size-2"
			/>
			<div className="flex size-full flex-col overflow-hidden rounded-xl bg-white text-gray-800 shadow-md">
				<div className="min-h-0 flex-1 bg-gray-100">
					<iframe
						src={data.mapSrc}
						title={data.title || "Map"}
						loading="lazy"
						referrerPolicy="no-referrer-when-downgrade"
						className="h-full w-full border-0"
					/>
				</div>
				<a
					href={data.url}
					target="_blank"
					rel="noopener noreferrer"
					onPointerDown={(e) => e.stopPropagation()}
					className="flex shrink-0 items-start gap-2 border-t border-gray-200 bg-white px-3 py-2.5 no-underline hover:bg-gray-50"
				>
					<MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-red-500" />
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold text-gray-900">
							{data.title || "Google Maps"}
						</div>
						{data.address ? (
							<div className="line-clamp-1 text-xs text-gray-500">
								{data.address}
							</div>
						) : null}
					</div>
					<ExternalLink
						aria-hidden
						className="mt-0.5 size-3.5 shrink-0 text-gray-400"
					/>
				</a>
			</div>
			<NodeHandles />
		</div>
	);
}
