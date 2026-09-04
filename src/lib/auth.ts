import "@tanstack/react-start/server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db";
import { user } from "#/db/schema";
import { env } from "#/env";

async function anyUserExists() {
	const rows = await db.select({ id: user.id }).from(user).limit(1);
	return rows.length > 0;
}

const githubClientId = env.GITHUB_CLIENT_ID;
const githubClientSecret = env.GITHUB_CLIENT_SECRET;
const githubProvider =
	githubClientId && githubClientSecret
		? {
				github: {
					enabled: true,
					clientId: githubClientId,
					clientSecret: githubClientSecret,
				},
			}
		: {};

export const hasGithubAuth = Boolean(githubClientId && githubClientSecret);

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "sqlite" }),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: githubProvider,
	databaseHooks: {
		user: {
			create: {
				before: async () => {
					if (await anyUserExists()) {
						throw new APIError("FORBIDDEN", {
							message:
								"Registration is closed. This is a single-user instance.",
						});
					}
				},
			},
		},
	},

	plugins: [tanstackStartCookies()],
});
