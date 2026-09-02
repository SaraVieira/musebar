import type { Edge, Node } from "@xyflow/react";

const THUMB_W = 480;
const THUMB_H = 300;
const PAD = 16;
const BG = "#0a0a0a";
const EDGE = "#334155";

const DEFAULT_SIZE: Record<string, { w: number; h: number }> = {
	note: { w: 240, h: 160 },
	todo: { w: 260, h: 200 },
	text: { w: 200, h: 40 },
	frame: { w: 400, h: 300 },
	file: { w: 220, h: 90 },
	image: { w: 240, h: 180 },
	bookmark: { w: 300, h: 110 },
	embed: { w: 480, h: 270 },
	map: { w: 320, h: 300 },
	model: { w: 360, h: 300 },
	pdf: { w: 360, h: 460 },
};

const TYPE_FILL: Record<string, string> = {
	note: "#facc15",
	todo: "#38bdf8",
	text: "#e2e8f0",
	frame: "#1e293b",
	file: "#a78bfa",
	image: "#fb7185",
	bookmark: "#34d399",
	embed: "#f97316",
	map: "#ef4444",
	model: "#8b5cf6",
	pdf: "#f87171",
};

function nodeSize(n: Node) {
	const w = n.width ?? DEFAULT_SIZE[n.type ?? ""]?.w ?? 200;
	const h = n.height ?? DEFAULT_SIZE[n.type ?? ""]?.h ?? 120;
	return { w, h };
}

function fillFor(n: Node): string {
	const color =
		typeof (n.data as { color?: unknown })?.color === "string"
			? ((n.data as { color: string }).color as string)
			: undefined;
	return color ?? TYPE_FILL[n.type ?? ""] ?? "#64748b";
}

function escapeAttr(v: string) {
	return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function generateBoardThumbnail(
	nodes: Node[],
	edges: Edge[],
): string | null {
	if (nodes.length === 0) return null;

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for (const n of nodes) {
		const { w, h } = nodeSize(n);
		const x = n.position.x;
		const y = n.position.y;
		if (x < minX) minX = x;
		if (y < minY) minY = y;
		if (x + w > maxX) maxX = x + w;
		if (y + h > maxY) maxY = y + h;
	}

	const contentW = Math.max(1, maxX - minX);
	const contentH = Math.max(1, maxY - minY);
	const innerW = THUMB_W - PAD * 2;
	const innerH = THUMB_H - PAD * 2;
	const scale = Math.min(innerW / contentW, innerH / contentH);
	const offsetX = PAD + (innerW - contentW * scale) / 2 - minX * scale;
	const offsetY = PAD + (innerH - contentH * scale) / 2 - minY * scale;

	const nodeIndex = new Map(nodes.map((n) => [n.id, n]));

	const rects: string[] = [];
	const frames: string[] = [];
	for (const n of nodes) {
		const { w, h } = nodeSize(n);
		const x = n.position.x * scale + offsetX;
		const y = n.position.y * scale + offsetY;
		const rw = Math.max(2, w * scale);
		const rh = Math.max(2, h * scale);
		const fill = fillFor(n);
		const rx = Math.min(4, rw / 4, rh / 4);
		const isFrame = n.type === "frame";
		const rect = `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${isFrame ? "none" : escapeAttr(fill)}"${isFrame ? ` stroke="${escapeAttr(fill)}" stroke-width="1" stroke-dasharray="3 2"` : ""} />`;
		if (isFrame) frames.push(rect);
		else rects.push(rect);
	}

	const lines: string[] = [];
	for (const e of edges) {
		const s = nodeIndex.get(e.source);
		const t = nodeIndex.get(e.target);
		if (!s || !t) continue;
		const sSize = nodeSize(s);
		const tSize = nodeSize(t);
		const sx = (s.position.x + sSize.w / 2) * scale + offsetX;
		const sy = (s.position.y + sSize.h / 2) * scale + offsetY;
		const tx = (t.position.x + tSize.w / 2) * scale + offsetX;
		const ty = (t.position.y + tSize.h / 2) * scale + offsetY;
		lines.push(
			`<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${EDGE}" stroke-width="0.75" opacity="0.7" />`,
		);
	}

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${THUMB_W} ${THUMB_H}" preserveAspectRatio="xMidYMid meet">`,
		`<rect width="100%" height="100%" fill="${BG}" />`,
		...frames,
		...lines,
		...rects,
		`</svg>`,
	].join("");
}
