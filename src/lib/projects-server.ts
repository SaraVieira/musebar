import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { Projects } from "#/db/schema";
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
		return project ?? null;
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

export const updateProjectContent = createServerFn({ method: "POST" })
	.validator(
		z.object({
			id: z.string(),
			content: z.string(),
			thumbnail: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ data }) => {
		const session = await requireServerSession();
		const patch: {
			content: string;
			updatedAt: Date;
			thumbnail?: string | null;
		} = { content: data.content, updatedAt: new Date() };
		if (data.thumbnail !== undefined) patch.thumbnail = data.thumbnail;
		await db
			.update(Projects)
			.set(patch)
			.where(
				and(eq(Projects.id, data.id), eq(Projects.userId, session.user.id)),
			);
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
