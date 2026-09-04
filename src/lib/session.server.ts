import "@tanstack/react-start/server-only";
import { redirect } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

export async function getServerSession() {
	const request = getRequest();
	return auth.api.getSession({ headers: request.headers });
}

export async function requireServerSession() {
	const session = await getServerSession();
	if (!session) throw redirect({ href: "/login" });
	return session;
}

export async function getRequestSession(request: Request) {
	return auth.api.getSession({ headers: request.headers });
}
