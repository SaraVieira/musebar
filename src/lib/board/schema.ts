import type { Edge, Node } from "@xyflow/react";
import { z } from "zod";

const positionSchema = z.object({ x: z.number(), y: z.number() });

const nodeSchema = z
	.object({
		id: z.string().min(1),
		position: positionSchema,
		data: z.record(z.string(), z.unknown()).optional(),
	})
	.loose();

const edgeSchema = z
	.object({
		id: z.string().min(1),
		source: z.string().min(1),
		target: z.string().min(1),
	})
	.loose();

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function isSafeHref(href: unknown): boolean {
	if (typeof href !== "string") return false;
	try {
		return SAFE_LINK_PROTOCOLS.has(new URL(href, "https://x.invalid").protocol);
	} catch {
		return false;
	}
}

function sanitizeRichText(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sanitizeRichText);
	if (!value || typeof value !== "object") return value;

	const node = { ...(value as Record<string, unknown>) };

	if (Array.isArray(node.marks)) {
		node.marks = node.marks.filter((mark) => {
			if (!mark || typeof mark !== "object") return false;
			const m = mark as { type?: unknown; attrs?: { href?: unknown } };
			if (m.type !== "link") return true;
			return isSafeHref(m.attrs?.href);
		});
	}
	if (Array.isArray(node.content))
		node.content = node.content.map(sanitizeRichText);

	return node;
}

function sanitizeNodeData(node: Node): Node {
	const data = node.data as Record<string, unknown> | undefined;
	if (!data || !("content" in data)) return node;
	return {
		...node,
		data: { ...data, content: sanitizeRichText(data.content) },
	};
}

export interface ValidatedBoard {
	nodes: Node[];
	edges: Edge[];
	dropped: { nodes: number; edges: number };
}

export function validateBoard(
	rawNodes: unknown,
	rawEdges: unknown,
): ValidatedBoard {
	const nodes: Node[] = [];
	let droppedNodes = 0;
	for (const candidate of Array.isArray(rawNodes) ? rawNodes : []) {
		const parsed = nodeSchema.safeParse(candidate);
		if (parsed.success)
			nodes.push(sanitizeNodeData(parsed.data as unknown as Node));
		else droppedNodes++;
	}

	const edges: Edge[] = [];
	let droppedEdges = 0;
	for (const candidate of Array.isArray(rawEdges) ? rawEdges : []) {
		const parsed = edgeSchema.safeParse(candidate);
		if (parsed.success) edges.push(parsed.data as unknown as Edge);
		else droppedEdges++;
	}

	return {
		nodes,
		edges,
		dropped: { nodes: droppedNodes, edges: droppedEdges },
	};
}
