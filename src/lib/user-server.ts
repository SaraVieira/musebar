import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db";
import { user } from "#/db/schema";

export const anyUserExists = createServerFn({ method: "GET" }).handler(
  async () => {
    const rows = await db.select({ id: user.id }).from(user).limit(1);
    return rows.length > 0;
  },
);
