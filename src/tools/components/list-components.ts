import fs from "node:fs/promises";
import path from "node:path";
import {
	getDocsPath,
} from "@config/cache.config.js";
import { pluginManager } from "@plugins/plugin-manager.js";
import { BaseTool } from "@tools/base-tool.js";
import { logger } from "@utils/logger.js";

export class ListComponentsTool extends BaseTool {
	readonly name = "list_components";
	readonly title = "List Components Tool";
	readonly description = "List all components from cached documentation";
	readonly inputSchema = {};

	async execute(_params: Record<string, unknown>): Promise<{
		content: Array<{ type: "text"; text: string }>;
	}> {
		try {
			const cacheConfig = pluginManager.getActivePluginConfig();
			const docsPath = getDocsPath(cacheConfig);
			const componentsPath = path.join(docsPath, "components");

			logger.debug("Looking for components in:", { componentsPath });

			// Check if the components directory exists
			try {
				await fs.access(componentsPath);
			} catch (error) {
				logger.warn("Components directory not found in cache", {
					componentsPath,
					error: error instanceof Error ? error.message : String(error),
				});
				return {
					content: [
						{
							type: "text",
							text: "Components directory not found in cache. Please ensure the HeroUI repository has been cloned successfully.",
						},
					],
				};
			}

			// Read all files in the components directory
			const files = await fs.readdir(componentsPath, { withFileTypes: true });

			// Filter for .mdx files and extract component names
			const componentFiles = files
				.filter((file) => file.isFile() && file.name.endsWith(".mdx"))
				.map((file) => file.name.replace(".mdx", ""))
				.sort();

			if (componentFiles.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: "No component MDX files found in the cached documentation directory.",
						},
					],
				};
			}

			// Format the response
			const componentsList = componentFiles
				.map((component) => `- ${component}`)
				.join("\n");

			return {
				content: [
					{
						type: "text",
						text: `${componentsList}`,
					},
				],
			};
		} catch (error) {
			logger.error("Error listing components from cache:", error);
			return {
				content: [
					{
						type: "text",
						text: `Error reading components from cache: ${error instanceof Error ? error.message : "Unknown error"}`,
					},
				],
			};
		}
	}
}
