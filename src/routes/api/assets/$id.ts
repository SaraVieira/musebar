import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { Assets } from "#/db/schema";
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
	const session = await getRequestSession(request);
	if (!session) return new Response("Unauthorized", { status: 401 });

	const [asset] = await db
		.select()
		.from(Assets)
		.where(and(eq(Assets.id, params.id), eq(Assets.userId, session.user.id)))
		.limit(1);
	if (!asset) return new Response("Not found", { status: 404 });

	const bytes = new Uint8Array(asset.data as Buffer);
	const disposition = isInlineSafeMime(asset.mimeType)
		? "inline"
		: "attachment";

	return new Response(bytes, {
		headers: {
			"Content-Type": asset.mimeType,
			"Content-Length": String(asset.size),
			"Cache-Control": "private, max-age=31536000, immutable",
			"Content-Disposition": `${disposition}; ${safeFilename(asset.name)}`,
			"X-Content-Type-Options": "nosniff",
		},
	});
}

export const Route = createFileRoute("/api/assets/$id")({
	server: { handlers: { GET: handler } },
});
