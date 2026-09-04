import { NodeResizer } from "@xyflow/react";
import { useBoardCommit } from "#/lib/board/history-context";

interface BoardResizerProps {
	minWidth: number;
	minHeight: number;
	selected?: boolean;
	keepAspectRatio?: boolean;
}

export function BoardResizer({
	minWidth,
	minHeight,
	selected,
	keepAspectRatio,
}: BoardResizerProps) {
	const commit = useBoardCommit();
	return (
		<NodeResizer
			minWidth={minWidth}
			minHeight={minHeight}
			isVisible={selected}
			keepAspectRatio={keepAspectRatio}
			onResizeStart={commit}
			lineClassName="!border-gray-900/40"
			handleClassName="!bg-white !border !border-gray-900/40 !size-2"
		/>
	);
}
