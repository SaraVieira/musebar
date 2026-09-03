import { NodeResizer } from "@xyflow/react";
import { useBoardCommit } from "#/lib/board/history-context";

interface BoardResizerProps {
	minWidth: number;
	minHeight: number;
	/** The node's own `selected` prop — handles are only shown when selected. */
	selected?: boolean;
	keepAspectRatio?: boolean;
}

/**
 * The board's standard resize handles. Wraps React Flow's NodeResizer so every
 * node type gets the same handle styling and the same "snapshot before resize"
 * history behaviour without repeating it.
 */
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
