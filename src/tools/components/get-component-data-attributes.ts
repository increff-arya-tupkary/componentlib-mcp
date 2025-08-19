/**
 * Get Component Data Attributes Tool
 *
 * This tool extracts data attributes sections from HeroUI component documentation,
 * including data-* attributes that can be used for styling and behavior control.
 * It focuses specifically on the data attributes available on components.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { defaultCacheConfig, getDocsPath } from "@config/cache.config.js";
import { pluginManager } from "@plugins/plugin-manager.js";
import { BaseTool } from "@tools/base-tool.js";
import { replaceCodeDemoWithCode } from "@utils/codedemo-processor.js";
import { logger } from "@utils/logger.js";
import { filterMdxContent } from "@utils/mdx-processor.js";
import {
	extractSectionWithSubsections,
	getCommonSectionVariations,
	type SectionMatchOptions,
} from "@utils/mdx-section-parser.js";
import { z } from "zod";

export class GetComponentDataAttributesTool extends BaseTool {
	readonly name = "get_component_data_attributes";
	readonly title = "Get Component Data Attributes Tool";
	readonly description =
		"Extract data attributes sections from HeroUI component documentation showing available data-* attributes";
	readonly inputSchema = {
		componentName: z
			.string()
			.min(1, "Component name is required")
			.describe("Name of the HeroUI component (e.g., 'button', 'input')"),
	};

	async execute(
		params: z.infer<z.ZodObject<typeof this.inputSchema>>,
	): Promise<{
		content: Array<{ type: "text"; text: string }>;
	}> {
		this.validateParams(params);

		const { componentName } = params;

		// Define the data attributes sections to extract
		const sectionsToExtract = ["Data Attributes"];
		const includeSubsections = true;
		const exactMatch = false;

		try {
			// Get the path to the cached docs/components directory
			const cacheConfig = pluginManager.getActivePluginConfig();
			const docsPath = getDocsPath(cacheConfig);
			const componentsPath = path.join(docsPath, "components");
			const componentFilePath = path.join(
				componentsPath,
				`${componentName}.mdx`,
			);

			logger.debug("Looking for component data attributes documentation:", {
				componentFilePath,
				sectionsToExtract,
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
			mdxContent = filterMdxContent(mdxContent);

			// Replace CodeDemo components with actual code
			mdxContent = await replaceCodeDemoWithCode(mdxContent);

			// Extract the data attributes sections
			const extractedSections: string[] = [];
			const matchOptions: SectionMatchOptions = {
				caseInsensitive: true,
				partialMatch: !exactMatch,
				exact: exactMatch,
			};

			for (const sectionName of sectionsToExtract) {
				// Try direct extraction first
				let sectionContent = extractSectionWithSubsections(
					mdxContent,
					sectionName,
					includeSubsections,
					matchOptions,
				);

				// If not found, try common variations
				if (!sectionContent) {
					const variations = getCommonSectionVariations(sectionName);
					for (const variation of variations) {
						sectionContent = extractSectionWithSubsections(
							mdxContent,
							variation,
							includeSubsections,
							matchOptions,
						);
						if (sectionContent) {
							logger.debug(`Found section using variation: ${variation}`, {
								originalName: sectionName,
								foundVariation: variation,
							});
							break;
						}
					}
				}

				// Also try some specific data attributes variations
				if (!sectionContent) {
					const dataAttributeVariations = [
						"Data Attributes",
						"data attributes",
						"Data Attribute",
						"data attribute",
						"HTML Attributes",
						"html attributes",
						"Attributes",
						"attributes",
					];

					for (const variation of dataAttributeVariations) {
						sectionContent = extractSectionWithSubsections(
							mdxContent,
							variation,
							includeSubsections,
							matchOptions,
						);
						if (sectionContent) {
							logger.debug(
								`Found section using data attribute variation: ${variation}`,
								{
									originalName: sectionName,
									foundVariation: variation,
								},
							);
							break;
						}
					}
				}

				if (sectionContent) {
					extractedSections.push(sectionContent);
					logger.debug(`Successfully extracted section: ${sectionName}`, {
						componentName,
						sectionLength: sectionContent.length,
					});
				} else {
					logger.debug(`Section not found: ${sectionName}`, {
						componentName,
						availableSections: this.getAvailableSections(mdxContent),
					});
				}
			}

			// If no data attributes sections found, return helpful message
			if (extractedSections.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: `No data attributes section found for component '${componentName}'. Available sections: ${this.getAvailableSections(mdxContent).join(", ")}`,
						},
					],
				};
			}

			// Combine all extracted sections
			const combinedContent = extractedSections.join("\n\n---\n\n");

			logger.debug(
				"Successfully extracted component data attributes sections",
				{
					componentName,
					sectionsFound: extractedSections.length,
					totalLength: combinedContent.length,
				},
			);

			return {
				content: [
					{
						type: "text",
						text: combinedContent,
					},
				],
			};
		} catch (error) {
			logger.error("Error extracting component data attributes:", error);
			return {
				content: [
					{
						type: "text",
						text: `Error extracting data attributes from component documentation for '${componentName}': ${error instanceof Error ? error.message : "Unknown error"}`,
					},
				],
			};
		}
	}

	/**
	 * Get list of available sections in the MDX content for error messages
	 */
	private getAvailableSections(content: string): string[] {
		const lines = content.split("\n");
		const sections: string[] = [];

		for (const line of lines) {
			const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
			if (headerMatch) {
				const level = headerMatch[1].length;
				const title = headerMatch[2].trim();
				// Only show level 1 and 2 headers as main sections
				if (level <= 2) {
					sections.push(title);
				}
			}
		}

		return sections;
	}
}
