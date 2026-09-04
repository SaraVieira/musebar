import { z } from "zod";

export const PORTABLE_BOARD_FORMAT = "musebar-board";
export const PORTABLE_ARCHIVE_FORMAT = "musebar-archive";
export const PORTABLE_VERSION = 1;

const portableAssetSchema = z.object({
	id: z.string().min(1),
	name: z.string(),
	mimeType: z.string(),
	/** base64, so an export is self-contained rather than a set of dead links. */
	data: z.string(),
});

export const portableBoardSchema = z.object({
	format: z.literal(PORTABLE_BOARD_FORMAT),
	version: z.number().int().positive(),
	exportedAt: z.string().optional(),
	name: z.string().min(1).max(120),
	description: z.string().max(500).nullable().optional(),
	content: z.string(),
	assets: z.array(portableAssetSchema).default([]),
});

const portableArchiveSchema = z.object({
	format: z.literal(PORTABLE_ARCHIVE_FORMAT),
	version: z.number().int().positive(),
	exportedAt: z.string().optional(),
	boards: z.array(portableBoardSchema),
});

export type PortableBoard = z.infer<typeof portableBoardSchema>;
export type PortableArchive = z.infer<typeof portableArchiveSchema>;

export type ParsedImport =
	| { ok: true; boards: PortableBoard[] }
	| { ok: false; error: string };

/** Accepts either a single exported board or a whole archive. */
export function parseImport(raw: unknown): ParsedImport {
	const board = portableBoardSchema.safeParse(raw);
	if (board.success) {
		return board.data.version > PORTABLE_VERSION
			? {
					ok: false,
					error: "This file was made by a newer version of Musebar.",
				}
			: { ok: true, boards: [board.data] };
	}

	const archive = portableArchiveSchema.safeParse(raw);
	if (archive.success) {
		return archive.data.version > PORTABLE_VERSION
			? {
					ok: false,
					error: "This file was made by a newer version of Musebar.",
				}
			: { ok: true, boards: archive.data.boards };
	}

	return { ok: false, error: "Not a Musebar export." };
}

/**
 * Rewrites `/api/assets/<old>` to the ids the assets were given on import.
 * Unmapped references are left alone so nothing is silently corrupted.
 */
export function rewriteAssetReferences(
	content: string,
	idMap: ReadonlyMap<string, string>,
): string {
	if (idMap.size === 0) return content;
	return content.replace(
		/\/api\/assets\/([A-Za-z0-9_-]+)/g,
		(match, id: string) => {
			const next = idMap.get(id);
			return next ? `/api/assets/${next}` : match;
		},
	);
}

/** Filename-safe slug for a downloaded export. */
export function exportFilename(name: string, extension: string): string {
	const slug =
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "") || "board";
	return `${slug}.${extension}`;
}
