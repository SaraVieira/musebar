import "@tanstack/react-start/server-only";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

export async function getServerSession() {
  const request = getRequest();
  return auth.api.getSession({ headers: request.headers });
}

export async function requireServerSession() {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
