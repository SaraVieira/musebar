import { createHash, randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { Assets, Projects } from "#/db/schema";
import { referencedAssetIds } from "#/lib/board/assets";
import {
	PORTABLE_ARCHIVE_FORMAT,
	PORTABLE_BOARD_FORMAT,
	PORTABLE_VERSION,
	type PortableArchive,
	type PortableBoard,
	portableBoardSchema,
	rewriteAssetReferences,
} from "#/lib/board/portable";
import { requireServerSession } from "#/lib/session.server";

export const listProjects = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await requireServerSession();
		return db
			.select({
				id: Projects.id,
				name: Projects.name,
				description: Projects.description,
				thumbnail: Projects.thumbnail,
				updatedAt: Projects.updatedAt,
			})
			.from(Projects)
			.where(eq(Projects.userId, session.user.id))
			.orderBy(desc(Projects.updatedAt));
	},
);

async function collectOrphanedAssets(
	projectId: string,
	content: string | null,
) {
	try {
		const referenced = referencedAssetIds(content);
		const rows = await db
			.select({ id: Assets.id })
			.from(Assets)
			.where(eq(Assets.projectId, projectId));
		const orphans = rows.filter((r) => !referenced.has(r.id)).map((r) => r.id);
		if (orphans.length > 0) {
			await db.delete(Assets).where(inArray(Assets.id, orphans));
		}
	} catch {
		// Non-fatal: a board must still open if cleanup fails.
	}
}

export const getProject = createServerFn({ method: "GET" })
	.validator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const session = await requireServerSession();
		const [project] = await db
			.select()
			.from(Projects)
			.where(
				and(eq(Projects.id, data.id), eq(Projects.userId, session.user.id)),
			)
			.limit(1);
		if (!project) return null;
		await collectOrphanedAssets(project.id, project.content);
		return project;
	});

export const createProject = createServerFn({ method: "POST" })
	.validator(
		z.object({
			name: z.string().min(1).max(120),
			description: z.string().max(500).optional(),
			/** Serialised board content, when starting from a template. */
			content: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		const session = await requireServerSession();
		const id = crypto.randomUUID();
		await db.insert(Projects).values({
			id,
			name: data.name,
			description: data.description ?? null,
			content: data.content ?? null,
			userId: session.user.id,
		});
		return { id };
	});

export const updateProject = createServerFn({ method: "POST" })
	.validator(
		z.object({
			id: z.string(),
			name: z.string().min(1).max(120),
			description: z.string().max(500).nullable(),
		}),
	)
	.handler(async ({ data }) => {
		const session = await requireServerSession();
		await db
			.update(Projects)
			.set({
				name: data.name,
				description: data.description,
				updatedAt: new Date(),
			})
			.where(
				and(eq(Projects.id, data.id), eq(Projects.userId, session.user.id)),
			);
	});

export type SaveContentResult =
	| { conflict: false; version: number }
	| { conflict: true };

export const updateProjectContent = createServerFn({ method: "POST" })
	.validator(
		z.object({
			id: z.string(),
			content: z.string(),
			thumbnail: z.string().nullable().optional(),
			expectedVersion: z.number().int().nonnegative(),
		}),
	)
	.handler(async ({ data }): Promise<SaveContentResult> => {
		const session = await requireServerSession();
		const patch: {
			content: string;
			updatedAt: Date;
			version: number;
			thumbnail?: string | null;
		} = {
			content: data.content,
			updatedAt: new Date(),
			version: data.expectedVersion + 1,
		};
		if (data.thumbnail !== undefined) patch.thumbnail = data.thumbnail;

		const rows = await db
			.update(Projects)
			.set(patch)
			.where(
				and(
					eq(Projects.id, data.id),
					eq(Projects.userId, session.user.id),
					eq(Projects.version, data.expectedVersion),
				),
			)
			.returning({ version: Projects.version });

		if (rows.length === 0) return { conflict: true };
		return { conflict: false, version: rows[0].version };
	});

export const deleteProject = createServerFn({ method: "POST" })
	.validator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const session = await requireServerSession();
		await db
			.delete(Projects)
			.where(
				and(eq(Projects.id, data.id), eq(Projects.userId, session.user.id)),
			);
	});

/** 192 bits of URL-safe randomness: the share link's only secret. */
function newShareToken() {
	return randomBytes(24).toString("base64url");
}

/**
 * Owner-only share toggle. Sharing mints a fresh token and unsharing clears it,
 * so turning sharing off revokes the old link rather than parking it.
 */
export const setProjectVisibility = createServerFn({ method: "POST" })
	.validator(z.object({ id: z.string(), isPublic: z.boolean() }))
	.handler(async ({ data }) => {
		const session = await requireServerSession();
		const shareToken = data.isPublic ? newShareToken() : null;
		await db
			.update(Projects)
			.set({ public: data.isPublic, shareToken, updatedAt: new Date() })
			.where(
				and(eq(Projects.id, data.id), eq(Projects.userId, session.user.id)),
			);
		return { isPublic: data.isPublic, shareToken };
	});

/** Invalidates the current link and issues a new one. */
export const rotateShareToken = createServerFn({ method: "POST" })
	.validator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const session = await requireServerSession();
		const shareToken = newShareToken();
		const rows = await db
			.update(Projects)
			.set({ shareToken, updatedAt: new Date() })
			.where(
				and(
					eq(Projects.id, data.id),
					eq(Projects.userId, session.user.id),
					eq(Projects.public, true),
				),
			)
			.returning({ shareToken: Projects.shareToken });
		if (rows.length === 0) throw new Error("That board is not shared.");
		return { shareToken };
	});

export const getPublicProject = createServerFn({ method: "GET" })
	.validator(z.object({ token: z.string().min(1) }))
	.handler(async ({ data }) => {
		const [project] = await db
			.select({
				name: Projects.name,
				description: Projects.description,
				content: Projects.content,
				updatedAt: Projects.updatedAt,
			})
			.from(Projects)
			.where(
				and(eq(Projects.shareToken, data.token), eq(Projects.public, true)),
			)
			.limit(1);
		return project ?? null;
	});

/** Board plus its assets inline, so an export restores without dead links. */
async function toPortableBoard(project: {
	id: string;
	name: string;
	description: string | null;
	content: string | null;
}): Promise<PortableBoard> {
	const assets = await db
		.select({
			id: Assets.id,
			name: Assets.name,
			mimeType: Assets.mimeType,
			data: Assets.data,
		})
		.from(Assets)
		.where(eq(Assets.projectId, project.id));

	return {
		format: PORTABLE_BOARD_FORMAT,
		version: PORTABLE_VERSION,
		exportedAt: new Date().toISOString(),
		name: project.name,
		description: project.description,
		content: project.content ?? '{"nodes":[],"edges":[]}',
		assets: assets.map((a) => ({
			id: a.id,
			name: a.name,
			mimeType: a.mimeType,
			data: Buffer.from(a.data as Buffer).toString("base64"),
		})),
	};
}

export const exportProject = createServerFn({ method: "GET" })
	.validator(z.object({ id: z.string() }))
	.handler(async ({ data }): Promise<PortableBoard | null> => {
		const session = await requireServerSession();
		const [project] = await db
			.select()
			.from(Projects)
			.where(
				and(eq(Projects.id, data.id), eq(Projects.userId, session.user.id)),
			)
			.limit(1);
		return project ? toPortableBoard(project) : null;
	});

export const exportAllProjects = createServerFn({ method: "GET" }).handler(
	async (): Promise<PortableArchive> => {
		const session = await requireServerSession();
		const projects = await db
			.select()
			.from(Projects)
			.where(eq(Projects.userId, session.user.id))
			.orderBy(desc(Projects.updatedAt));

		return {
			format: PORTABLE_ARCHIVE_FORMAT,
			version: PORTABLE_VERSION,
			exportedAt: new Date().toISOString(),
			boards: await Promise.all(projects.map(toPortableBoard)),
		};
	},
);

/**
 * Creates projects from an export. Assets are re-inserted under fresh ids and
 * the board content is rewritten to match, so an import never points at another
 * project's rows.
 */

/**
 * Creates a board owned by `userId` with a private copy of `assets`, rewriting
 * the content's asset URLs to the new ids. Shared by import and duplicate.
 *
 * The project row is written first because `Assets.projectId` is a foreign key,
 * then updated with the rewritten content once the new ids are known. `public`
 * and `shareToken` are never carried over: a copy must not inherit a live link.
 */
async function createBoardWithAssets(input: {
	userId: string;
	name: string;
	description: string | null;
	content: string;
	thumbnail?: string | null;
	assets: Array<{ id: string; name: string; mimeType: string; bytes: Buffer }>;
}) {
	const projectId = crypto.randomUUID();
	await db.insert(Projects).values({
		id: projectId,
		name: input.name,
		description: input.description,
		thumbnail: input.thumbnail ?? null,
		content: null,
		userId: input.userId,
	});

	const idMap = new Map<string, string>();
	for (const asset of input.assets) {
		const newId = crypto.randomUUID();
		idMap.set(asset.id, newId);
		await db.insert(Assets).values({
			id: newId,
			projectId,
			userId: input.userId,
			name: asset.name,
			mimeType: asset.mimeType,
			size: asset.bytes.length,
			checksum: createHash("sha256").update(asset.bytes).digest("hex"),
			data: asset.bytes,
		});
	}

	await db
		.update(Projects)
		.set({ content: rewriteAssetReferences(input.content, idMap) })
		.where(eq(Projects.id, projectId));

	return { id: projectId, name: input.name };
}

/** Copies a board, its files and its layout into a new private board. */
export const duplicateProject = createServerFn({ method: "POST" })
	.validator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const session = await requireServerSession();
		const [source] = await db
			.select()
			.from(Projects)
			.where(
				and(eq(Projects.id, data.id), eq(Projects.userId, session.user.id)),
			)
			.limit(1);
		if (!source) throw new Error("Board not found.");

		const assets = await db
			.select()
			.from(Assets)
			.where(eq(Assets.projectId, source.id));

		return createBoardWithAssets({
			userId: session.user.id,
			name: `${source.name} (copy)`.slice(0, 120),
			description: source.description,
			content: source.content ?? '{"nodes":[],"edges":[]}',
			thumbnail: source.thumbnail,
			assets: assets.map((a) => ({
				id: a.id,
				name: a.name,
				mimeType: a.mimeType,
				bytes: Buffer.from(a.data as Buffer),
			})),
		});
	});

export const importProjects = createServerFn({ method: "POST" })
	.validator(z.object({ boards: z.array(portableBoardSchema) }))
	.handler(async ({ data }) => {
		const session = await requireServerSession();
		const created: Array<{ id: string; name: string }> = [];

		for (const board of data.boards) {
			created.push(
				await createBoardWithAssets({
					userId: session.user.id,
					name: board.name,
					description: board.description ?? null,
					content: board.content,
					assets: board.assets.map((a) => ({
						id: a.id,
						name: a.name,
						mimeType: a.mimeType,
						bytes: Buffer.from(a.data, "base64"),
					})),
				}),
			);
		}

		return { created };
	});
