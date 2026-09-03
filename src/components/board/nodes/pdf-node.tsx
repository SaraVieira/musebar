import type { Node, NodeProps } from "@xyflow/react";
import { Download, ExternalLink } from "lucide-react";
import { BoardResizer } from "../board-resizer";
import { NodeDragHeader } from "../node-drag-header";
import { NodeHandles } from "../node-handles";

export const PDF_DRAG_HANDLE_CLASS = "pdf-drag-handle";

interface PdfNodeData {
	src: string;
	name: string;
	size?: number;
	[key: string]: unknown;
}

export type PdfNode = Node<PdfNodeData, "pdf">;

function formatBytes(bytes: number | undefined): string {
	if (!bytes || bytes <= 0) return "";
	const units = ["B", "KB", "MB", "GB"];
	let n = bytes;
	let i = 0;
	while (n >= 1024 && i < units.length - 1) {
		n /= 1024;
		i++;
	}
	return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function PdfNodeView({
	data,
	selected,
	width,
	height,
}: NodeProps<PdfNode>) {
	// #toolbar=0 hides the pdf.js browser toolbar for a cleaner in-card view;
	// users can still zoom/scroll and use the header buttons to open/download.
	const iframeSrc = `${data.src}#toolbar=0&navpanes=0`;
	const size = formatBytes(data.size);

	return (
		<div className="group relative size-full" style={{ width, height }}>
			<BoardResizer minWidth={260} minHeight={240} selected={selected} />
			<div className="flex size-full flex-col overflow-hidden rounded-xl bg-neutral-900 text-white shadow-md">
				<NodeDragHeader
					handleClass={PDF_DRAG_HANDLE_CLASS}
					className="h-8 gap-2 px-2"
				>
					<span className="min-w-0 flex-1 truncate text-xs font-medium">
						{data.name}
					</span>
					{size ? (
						<span className="shrink-0 text-[10px] text-gray-500">{size}</span>
					) : null}
					<a
						href={data.src}
						target="_blank"
						rel="noopener noreferrer"
						onPointerDown={(e) => e.stopPropagation()}
						className="hover:text-white"
						title="Open in new tab"
						aria-label="Open in new tab"
					>
						<ExternalLink aria-hidden className="size-3.5" />
					</a>
					<a
						href={data.src}
						download={data.name}
						onPointerDown={(e) => e.stopPropagation()}
						className="hover:text-white"
						title="Download"
						aria-label="Download"
					>
						<Download aria-hidden className="size-3.5" />
					</a>
				</NodeDragHeader>
				<div className="relative min-h-0 flex-1 bg-neutral-800">
					<iframe
						src={iframeSrc}
						title={data.name}
						className="absolute inset-0 h-full w-full border-0"
					/>
				</div>
			</div>
			<NodeHandles />
		</div>
	);
}
