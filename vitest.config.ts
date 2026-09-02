import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"#": new URL("./src", import.meta.url).pathname,
		},
	},
	test: {
		// Pure functions only — no component or DOM tests, so no jsdom needed.
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
});
