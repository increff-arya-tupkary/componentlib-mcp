import fs from "node:fs/promises";
import path from "node:path";
import { defaultCacheConfig, getHeroUiDocsPath } from "@config/cache.config.js";
import { BaseTool } from "@tools/base-tool.js";
import { logger } from "@utils/logger.js";
import z from "zod";

export class GetComponentDocsTool extends BaseTool {
	readonly name = "get_component_docs";
	readonly title = "Get Component Docs Tool";
	readonly description =
		"Retrieve documentation for a specific HeroUI component from cached documentation";
	readonly inputSchema = {
		componentName: z.string().min(1, "Component name is required"),
	};

	/**
	 * Filter out unwanted MDX elements from the documentation content
	 */
	private filterMdxContent(content: string): string {
		let filteredContent = content;

		// Remove PackageManagers component
		filteredContent = filteredContent.replace(
			/<PackageManagers[\s\S]*?\/>/g,
			"",
		);

		// Remove CarbonAd component
		filteredContent = filteredContent.replace(/<CarbonAd\s*\/>/g, "");

		// Remove ComponentLinks component
		filteredContent = filteredContent.replace(
			/<ComponentLinks[\s\S]*?\/>/g,
			"",
		);

		// Clean up any extra whitespace left behind
		filteredContent = filteredContent.replace(/\n\s*\n\s*\n/g, "\n\n");

		return filteredContent.trim();
	}

	async execute(
		params: z.infer<z.ZodObject<typeof this.inputSchema>>,
	): Promise<{
		content: Array<{ type: "text"; text: string }>;
	}> {
		this.validateParams(params);

		const { componentName } = params;

		try {
			// Get the path to the cached docs/components directory
			const docsPath = getHeroUiDocsPath(defaultCacheConfig);
			const componentsPath = path.join(docsPath, "components");
			const componentFilePath = path.join(
				componentsPath,
				`${componentName}.mdx`,
			);

			logger.debug("Looking for component documentation:", {
				componentFilePath,
			});

			// Check if the component file exists
			try {
				await fs.access(componentFilePath);
			} catch (error) {
				logger.warn("Component documentation not found", {
					componentName,
					componentFilePath,
					error: error instanceof Error ? error.message : String(error),
				});
				return {
					content: [
						{
							type: "text",
							text: `Component documentation for '${componentName}' not found in cache. Please ensure the component name is correct and the HeroUI repository has been cloned successfully.`,
						},
					],
				};
			}

			// Read the MDX file content
			let mdxContent = await fs.readFile(componentFilePath, "utf-8");

			// Filter out unwanted MDX elements
			mdxContent = this.filterMdxContent(mdxContent);

			logger.debug("Successfully read and filtered component documentation", {
				componentName,
				originalLength: mdxContent.length,
				filteredLength: mdxContent.length,
			});

			return {
				content: [
					{
						type: "text",
						text: mdxContent,
					},
				],
			};
		} catch (error) {
			logger.error("Error reading component documentation:", error);
			return {
				content: [
					{
						type: "text",
						text: `Error reading component documentation for '${componentName}': ${error instanceof Error ? error.message : "Unknown error"}`,
					},
				],
			};
		}
	}
}
