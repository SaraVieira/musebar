import { FileIcon } from "@react-symbols/icons/utils";
import { type Node, type NodeProps, NodeResizer } from "@xyflow/react";
import { useBoardCommit } from "#/lib/board/history-context";
import { NodeHandles } from "../node-handles";

interface FileNodeData {
	src: string;
	name: string;
	mimeType: string;
	size: number;
	[key: string]: unknown;
}

export type FileNode = Node<FileNodeData, "file">;

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeLabel(name: string, mimeType: string) {
	const ext = name.split(".").pop();
	if (ext && ext !== name && ext.length <= 5) return ext.toUpperCase();
	const subtype = mimeType.split("/")[1];
	return subtype ? subtype.toUpperCase() : "FILE";
}

export function FileNodeView({
	data,
	selected,
	width,
	height,
}: NodeProps<FileNode>) {
	const commit = useBoardCommit();
	return (
		<div className="group relative size-full" style={{ width, height }}>
			<NodeResizer
				minWidth={200}
				minHeight={80}
				isVisible={selected}
				onResizeStart={commit}
				lineClassName="!border-gray-900/40"
				handleClassName="!bg-white !border !border-gray-900/40 !size-2"
			/>
			<div className="flex size-full items-center gap-3 overflow-hidden rounded-xl bg-white p-3 text-[13px] text-gray-800 shadow-md">
				<div className="size-10 shrink-0">
					<FileIcon fileName={data.name} autoAssign width={40} height={40} />
				</div>
				<a
					href={data.src}
					download={data.name}
					target="_blank"
					rel="noopener noreferrer"
					onPointerDown={(e) => e.stopPropagation()}
					className="group/link flex min-w-0 flex-1 flex-col gap-0.5 text-inherit no-underline"
				>
					<div className="truncate font-semibold group-hover/link:underline">
						{data.name}
					</div>
					<div className="text-xs opacity-60">
						{fileTypeLabel(data.name, data.mimeType)} · {formatBytes(data.size)}
					</div>
				</a>
			</div>
			<NodeHandles />
		</div>
	);
}
