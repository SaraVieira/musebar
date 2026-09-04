import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "#/db";
import { Assets, Projects } from "#/db/schema";
import { getRequestSession } from "#/lib/session.server";

function safeFilename(name: string) {
	const ascii = name.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
	const encoded = encodeURIComponent(name);
	return `filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function isInlineSafeMime(mime: string) {
	return (
		mime.startsWith("image/") ||
		mime.startsWith("video/") ||
		mime.startsWith("audio/") ||
		mime === "application/pdf"
	);
}

async function handler({
	request,
	params,
}: {
	request: Request;
	params: { id: string };
}) {
	// Joined so one query answers both "who owns this?" and "is its board
	// shared?" — a public board's images have to load for anonymous viewers.
	const [row] = await db
		.select({ asset: Assets, isPublic: Projects.public })
		.from(Assets)
		.innerJoin(Projects, eq(Assets.projectId, Projects.id))
		.where(eq(Assets.id, params.id))
		.limit(1);

	// 404 rather than 401 for anything the caller may not see, so the endpoint
	// cannot be used to test whether an asset id exists.
	if (!row) return new Response("Not found", { status: 404 });

	const session = await getRequestSession(request);
	const isOwner = session?.user.id === row.asset.userId;
	if (!isOwner && !row.isPublic) {
		return new Response("Not found", { status: 404 });
	}

	const { asset } = row;
	const bytes = new Uint8Array(asset.data as Buffer);
	const disposition = isInlineSafeMime(asset.mimeType)
		? "inline"
		: "attachment";

	return new Response(bytes, {
		headers: {
			"Content-Type": asset.mimeType,
			"Content-Length": String(asset.size),
			// Stays `private` even when shared: a board can be un-published, and a
			// shared cache would keep serving it afterwards.
			"Cache-Control": "private, max-age=31536000, immutable",
			"Content-Disposition": `${disposition}; ${safeFilename(asset.name)}`,
			"X-Content-Type-Options": "nosniff",
		},
	});
}

export const Route = createFileRoute("/api/assets/$id")({
	server: { handlers: { GET: handler } },
});
