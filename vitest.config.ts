/**
 * Vitest configuration for HeroUI MCP Server
 */

import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./tests/setup.ts"],
		testTimeout: 30000,
		hookTimeout: 30000,
		teardownTimeout: 30000,
		isolate: true,
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: false,
			},
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"dist/",
				"tests/",
				"**/*.test.ts",
				"**/*.spec.ts",
			],
		},
	},
	resolve: {
		alias: {
			"@cache": resolve(__dirname, "./src/cache"),
			"@config": resolve(__dirname, "./src/config"),
			"@http": resolve(__dirname, "./src/http"),
			"@resources": resolve(__dirname, "./src/resources"),
			"@server": resolve(__dirname, "./src/server"),
			"@tools": resolve(__dirname, "./src/tools"),
			"@transport": resolve(__dirname, "./src/transport"),
			"@types": resolve(__dirname, "./src/types"),
			"@utils": resolve(__dirname, "./src/utils"),
		},
	},
});
