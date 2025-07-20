/**
 * Get Component Slots Tool
 *
 * This tool extracts the 'slots' section from HeroUI component documentation.
 * It focuses specifically on component slot definitions and their configurations.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { defaultCacheConfig, getHeroUiDocsPath } from "@config/cache.config.js";
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

export class GetComponentSlotsTool extends BaseTool {
	readonly name = "get_component_slots";
	readonly title = "Get Component Slots Tool";
	readonly description =
		"Extract slots section from HeroUI component documentation showing available component slots";
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

		// Define the slots section to extract
		const sectionsToExtract = ["Slots", "Custom Styles"];
		const includeSubsections = true;
		const exactMatch = false;

		try {
			// Get the path to the cached docs/components directory
			const docsPath = getHeroUiDocsPath(defaultCacheConfig);
			const componentsPath = path.join(docsPath, "components");
			const componentFilePath = path.join(
				componentsPath,
				`${componentName}.mdx`,
			);

			logger.debug("Looking for component slots documentation:", {
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

			// Extract the slots section
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

			// If no slots section found, provide helpful error message
			if (extractedSections.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: `No slots section found for component '${componentName}'. This component may not support slots or the documentation may not include slot information. Available sections: ${this.getAvailableSections(mdxContent).join(", ")}`,
						},
					],
				};
			}

			// Combine all extracted sections
			const combinedContent = extractedSections.join("\n\n---\n\n");

			logger.debug("Successfully extracted component slots section", {
				componentName,
				sectionsFound: extractedSections.length,
				totalLength: combinedContent.length,
			});

			return {
				content: [
					{
						type: "text",
						text: combinedContent,
					},
				],
			};
		} catch (error) {
			logger.error("Error extracting component slots:", error);
			return {
				content: [
					{
						type: "text",
						text: `Error extracting slots from component documentation for '${componentName}': ${error instanceof Error ? error.message : "Unknown error"}`,
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
