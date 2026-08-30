import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    SERVER_URL: z.string().url().optional(),
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  },

  clientPrefix: "VITE_",

  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
