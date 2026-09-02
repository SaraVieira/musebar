import { Handle, Position } from "@xyflow/react";

export function NodeHandles() {
	const base =
		"!size-2 !bg-white !border !border-gray-400 opacity-0 group-hover:opacity-100 transition-opacity";
	return (
		<>
			<Handle type="source" position={Position.Top} id="t" className={base} />
			<Handle type="source" position={Position.Right} id="r" className={base} />
			<Handle
				type="source"
				position={Position.Bottom}
				id="b"
				className={base}
			/>
			<Handle type="source" position={Position.Left} id="l" className={base} />
			<Handle type="target" position={Position.Top} id="tt" className={base} />
			<Handle
				type="target"
				position={Position.Right}
				id="rt"
				className={base}
			/>
			<Handle
				type="target"
				position={Position.Bottom}
				id="bt"
				className={base}
			/>
			<Handle type="target" position={Position.Left} id="lt" className={base} />
		</>
	);
}
