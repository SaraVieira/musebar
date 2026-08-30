import { createServerFn } from "@tanstack/react-start";
import { getServerSession } from "#/lib/session.server";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  return getServerSession();
});
