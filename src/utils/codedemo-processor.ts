/**
 * CodeDemo Processing Utilities
 *
 * This module provides utilities for processing CodeDemo components in MDX content,
 * including extracting file paths, reading component code, and replacing CodeDemo
 * tags with actual code blocks.
 */

import fs from "node:fs/promises";
import path from "node:path";
import {
	defaultCacheConfig,
	getHeroUiComponentsPath,
} from "@config/cache.config.js";
import { logger } from "@utils/logger.js";
import { cleanUpSvgTags } from "@utils/mdx-processor.js";

/**
 * Convert camelCase string to kebab-case
 * @param str The camelCase string to convert
 * @returns The kebab-case string
 */
function toKebabCase(str: string): string {
	return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Extract file path from CodeDemo files prop
 * @param codeDemoMatch The matched CodeDemo tag string
 * @returns The extracted file path or null if not found
 */
export function extractFilePathFromCodeDemo(
	codeDemoMatch: string,
): string | null {
	// Extract the files prop value
	const filesMatch = codeDemoMatch.match(/files=\{([^}]+)\}/);
	if (!filesMatch) return null;

	const filesValue = filesMatch[1].trim();

	// Handle patterns like accordionContent.usage, accordionContent.subtitle, etc.
	const pathMatch = filesValue.match(/(\w+Content)\.(\w+)/);
	if (pathMatch) {
		const [, contentPrefix, exampleName] = pathMatch;
		// Convert accordionContent to accordion
		const componentName = contentPrefix.replace("Content", "");
		return `${componentName}/${exampleName}`;
	}

	return null;
}

/**
 * Read component code from the HeroUI components cache
 * @param componentPath The path to the component file
 * @returns The component code content or null if not found
 */
export async function readComponentCode(
	componentPath: string,
): Promise<string | null> {
	try {
		const componentsPath = getHeroUiComponentsPath(defaultCacheConfig);
		// Convert componentPath to kebab-case before constructing file path
		const kebabComponentPath = toKebabCase(componentPath);
		// Look for .raw.jsx files which contain the actual component examples
		const fullPath = path.join(componentsPath, `${kebabComponentPath}.raw.jsx`);

		logger.debug("Reading component code from:", {
			originalPath: componentPath,
			kebabPath: kebabComponentPath,
			fullPath,
		});

		const code = await fs.readFile(fullPath, "utf-8");
		return code;
	} catch (error) {
		logger.warn("Failed to read component code:", {
			componentPath,
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}

/**
 * Create a formatted code block with code content only
 * @param code The code content
 * @returns A formatted markdown code block without title
 */
export function createFormattedCodeBlock(code: string): string {
	// Clean up SVG content to reduce context pollution
	const cleanedCode = cleanUpSvgTags(code);

	return `\`\`\`tsx
${cleanedCode}
\`\`\``;
}

/**
 * Replace CodeDemo components with actual JSX code
 * This is the main function that processes all CodeDemo components in content
 * @param content The MDX content containing CodeDemo components
 * @returns The processed content with CodeDemo components replaced
 */
export async function replaceCodeDemoWithCode(
	content: string,
): Promise<string> {
	// Find all CodeDemo components
	const codeDemoRegex = /<CodeDemo[^>]*\/>/g;
	let processedContent = content;
	const matches = Array.from(content.matchAll(codeDemoRegex));

	for (const match of matches) {
		const codeDemoTag = match[0];
		const filePath = extractFilePathFromCodeDemo(codeDemoTag);

		if (filePath) {
			const componentCode = await readComponentCode(filePath);

			if (componentCode) {
				// Create a formatted code block (without title since it's already in the MDX)
				const codeBlock = createFormattedCodeBlock(componentCode);

				processedContent = processedContent.replace(codeDemoTag, codeBlock);

				logger.debug("Replaced CodeDemo with actual code:", {
					filePath,
					codeLength: componentCode.length,
				});
			} else {
				// If we can't read the code, replace with a note
				processedContent = processedContent.replace(
					codeDemoTag,
					`<!-- CodeDemo component code not found for path: ${filePath} -->`,
				);
			}
		} else {
			// If we can't extract the file path, replace with a note
			processedContent = processedContent.replace(
				codeDemoTag,
				`<!-- CodeDemo component - unable to extract file path -->`,
			);
		}
	}

	return processedContent;
}
