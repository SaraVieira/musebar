import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { auth } from "#/lib/auth";
import { db } from "#/db";
import { Assets } from "#/db/schema";

async function handler({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  console.log("[assets] GET", params.id, "cookie?", !!request.headers.get("cookie"));
  const session = await auth.api.getSession({ headers: request.headers });
  console.log("[assets]  session:", session?.user?.id ?? "none");
  if (!session) return new Response("Unauthorized", { status: 401 });

  const [asset] = await db
    .select()
    .from(Assets)
    .where(and(eq(Assets.id, params.id), eq(Assets.userId, session.user.id)))
    .limit(1);
  console.log("[assets]  found:", !!asset);
  if (!asset) return new Response("Not found", { status: 404 });

  const bytes = new Uint8Array(asset.data as Buffer);

  return new Response(bytes, {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.size),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

export const Route = createFileRoute("/api/assets/$id")({
  server: { handlers: { GET: handler } },
});
