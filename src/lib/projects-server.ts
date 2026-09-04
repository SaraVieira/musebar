import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { Assets, Projects } from "#/db/schema";
import { referencedAssetIds } from "#/lib/board/assets";
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
		}),
	)
	.handler(async ({ data }) => {
		const session = await requireServerSession();
		const id = crypto.randomUUID();
		await db.insert(Projects).values({
			id,
			name: data.name,
			description: data.description ?? null,
			content: null,
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

/** Owner-only toggle for whether a board is reachable via its share link. */
export const setProjectVisibility = createServerFn({ method: "POST" })
	.validator(z.object({ id: z.string(), isPublic: z.boolean() }))
	.handler(async ({ data }) => {
		const session = await requireServerSession();
		await db
			.update(Projects)
			.set({ public: data.isPublic, updatedAt: new Date() })
			.where(
				and(eq(Projects.id, data.id), eq(Projects.userId, session.user.id)),
			);
		return { isPublic: data.isPublic };
	});

export const getPublicProject = createServerFn({ method: "GET" })
	.validator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const [project] = await db
			.select({
				id: Projects.id,
				name: Projects.name,
				description: Projects.description,
				content: Projects.content,
				updatedAt: Projects.updatedAt,
			})
			.from(Projects)
			.where(and(eq(Projects.id, data.id), eq(Projects.public, true)))
			.limit(1);
		return project ?? null;
	});
