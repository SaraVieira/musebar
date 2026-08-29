import { env } from "#/env";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db";
import { user } from "#/db/schema";

async function anyUserExists() {
  const rows = await db.select({ id: user.id }).from(user).limit(1);
  return rows.length > 0;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      enabled: true,
      clientId: env.GITHUB_CLIENT_ID!,
      clientSecret: env.GITHUB_CLIENT_SECRET!,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          if (await anyUserExists()) {
            throw new APIError("FORBIDDEN", {
              message: "Registration is closed. This is a single-user instance.",
            });
          }
        },
      },
    },
  },

  plugins: [tanstackStartCookies()],
});
