import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "#/db";
import { Assets, Projects } from "#/db/schema";
import { parseRangeHeader } from "#/lib/http-range";
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
	const [row] = await db
		.select({
			id: Assets.id,
			userId: Assets.userId,
			name: Assets.name,
			mimeType: Assets.mimeType,
			size: Assets.size,
			checksum: Assets.checksum,
			isPublic: Projects.public,
			shareToken: Projects.shareToken,
		})
		.from(Assets)
		.innerJoin(Projects, eq(Assets.projectId, Projects.id))
		.where(eq(Assets.id, params.id))
		.limit(1);

	if (!row) return new Response("Not found", { status: 404 });

	const session = await getRequestSession(request);
	// A board is shared only when it has a live token, so a stale `public` flag
	// with no token cannot leave its files readable.
	const isShared = row.isPublic && row.shareToken !== null;
	const isOwner = session?.user.id === row.userId;
	if (!isOwner && !isShared) {
		return new Response("Not found", { status: 404 });
	}

	const etag = `"${row.checksum ?? row.id}"`;
	const baseHeaders: Record<string, string> = {
		ETag: etag,
		"Accept-Ranges": "bytes",
		"Cache-Control": "private, max-age=31536000, immutable",
		"X-Content-Type-Options": "nosniff",
	};

	if (request.headers.get("if-none-match") === etag) {
		return new Response(null, { status: 304, headers: baseHeaders });
	}

	const [blobRow] = await db
		.select({ data: Assets.data })
		.from(Assets)
		.where(eq(Assets.id, params.id))
		.limit(1);
	if (!blobRow) return new Response("Not found", { status: 404 });

	const bytes = new Uint8Array(blobRow.data as Buffer);
	const disposition = isInlineSafeMime(row.mimeType) ? "inline" : "attachment";
	const contentHeaders = {
		...baseHeaders,
		"Content-Type": row.mimeType,
		"Content-Disposition": `${disposition}; ${safeFilename(row.name)}`,
	};

	const range = parseRangeHeader(request.headers.get("range"), bytes.length);
	if (range === "unsatisfiable") {
		return new Response(null, {
			status: 416,
			headers: {
				...contentHeaders,
				"Content-Range": `bytes */${bytes.length}`,
			},
		});
	}
	if (range) {
		const slice = bytes.subarray(range.start, range.end + 1);
		return new Response(slice, {
			status: 206,
			headers: {
				...contentHeaders,
				"Content-Length": String(slice.length),
				"Content-Range": `bytes ${range.start}-${range.end}/${bytes.length}`,
			},
		});
	}

	return new Response(bytes, {
		headers: { ...contentHeaders, "Content-Length": String(bytes.length) },
	});
}

export const Route = createFileRoute("/api/assets/$id")({
	server: { handlers: { GET: handler } },
});
