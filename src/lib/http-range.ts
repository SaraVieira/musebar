export interface ByteRange {
	start: number;
	end: number;
}

export function parseRangeHeader(
	header: string | null,
	size: number,
): ByteRange | "unsatisfiable" | null {
	if (!header) return null;

	const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
	if (!match) return null;

	const [, rawStart, rawEnd] = match;
	if (rawStart === "" && rawEnd === "") return null;
	if (size === 0) return "unsatisfiable";

	let start: number;
	let end: number;

	if (rawStart === "") {
		const suffix = Number(rawEnd);
		if (suffix === 0) return "unsatisfiable";
		start = Math.max(0, size - suffix);
		end = size - 1;
	} else {
		start = Number(rawStart);
		end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
	}

	if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
	if (start >= size) return "unsatisfiable";
	if (end < start) return "unsatisfiable";
	return { start, end };
}
