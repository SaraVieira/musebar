import { createHash } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { Assets, Projects } from "#/db/schema";
import { MAX_FILE_SIZE } from "#/lib/constants";
import { getRequestSession } from "#/lib/session.server";

async function handler({ request }: { request: Request }) {
	const session = await getRequestSession(request);
	if (!session) return new Response("Unauthorized", { status: 401 });

	const form = await request.formData();
	const file = form.get("file");
	const projectId = form.get("projectId");

	if (!(file instanceof File)) {
		return new Response("Missing file", { status: 400 });
	}
	if (typeof projectId !== "string") {
		return new Response("Missing projectId", { status: 400 });
	}
	if (file.size > MAX_FILE_SIZE) {
		return new Response("File too large", { status: 413 });
	}

	const [project] = await db
		.select({ id: Projects.id })
		.from(Projects)
		.where(
			and(eq(Projects.id, projectId), eq(Projects.userId, session.user.id)),
		)
		.limit(1);
	if (!project) return new Response("Project not found", { status: 404 });

	const bytes = Buffer.from(await file.arrayBuffer());
	const checksum = createHash("sha256").update(bytes).digest("hex");

	const [existing] = await db
		.select({ id: Assets.id, mimeType: Assets.mimeType })
		.from(Assets)
		.where(and(eq(Assets.projectId, projectId), eq(Assets.checksum, checksum)))
		.limit(1);
	if (existing) {
		return Response.json({
			id: existing.id,
			src: `/api/assets/${existing.id}`,
			mimeType: existing.mimeType,
		});
	}

	const id = crypto.randomUUID();

	await db.insert(Assets).values({
		id,
		projectId,
		userId: session.user.id,
		name: file.name || "upload",
		mimeType: file.type,
		size: file.size,
		checksum,
		data: bytes,
	});

	return Response.json({ id, src: `/api/assets/${id}`, mimeType: file.type });
}

export const Route = createFileRoute("/api/uploads")({
	server: { handlers: { POST: handler } },
});
