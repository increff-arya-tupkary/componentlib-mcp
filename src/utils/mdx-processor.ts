/**
 * MDX Content Processing Utilities
 *
 * This module provides utilities for filtering and cleaning MDX content,
 * specifically for removing unwanted components and cleaning up whitespace.
 */

/**
 * Remove PackageManagers components from MDX content
 */
export function removePackageManagersComponents(content: string): string {
	return content.replace(/<PackageManagers[\s\S]*?\/>/g, "");
}

/**
 * Remove CarbonAd components from MDX content
 */
export function removeCarbonAdComponents(content: string): string {
	return content.replace(/<CarbonAd\s*\/>/g, "");
}

/**
 * Remove ComponentLinks components from MDX content
 */
export function removeComponentLinksComponents(content: string): string {
	return content.replace(/<ComponentLinks[\s\S]*?\/>/g, "");
}

/**
 * Clean up extra whitespace in MDX content
 * Replaces multiple consecutive newlines with just two newlines
 */
export function cleanUpWhitespace(content: string): string {
	return content.replace(/\n\s*\n\s*\n+/g, "\n\n");
}

/**
 * Replace SVG tags content with empty SVG tags to reduce context pollution
 * Keeps the opening tag attributes but removes all inner content
 */
export function cleanUpSvgTags(content: string): string {
	return content.replace(/<svg([^>]*)>[\s\S]*?<\/svg>/g, "<svg$1></svg>");
}

/**
 * Remove the first import line from MDX content
 * Specifically targets imports like: import {buttonContent} from "@/content/components/button";
 * These are typically used for preprocessing and should be removed from the final result
 */
export function removeFirstImportLine(content: string): string {
	// Match the first import line that follows the pattern: import {...} from "@/content/components/...";
	// This regex looks for the first import statement from "@/content" path
	return content.replace(
		/^import\s*\{[^}]*\}\s*from\s*["']@\/content\/[^"']*["']\s*;\s*\n?/m,
		"",
	);
}

/**
 * Remove Installation section header from MDX content
 * Removes the "## Installation" line which is typically not needed in processed docs
 */
export function removeInstallationHeader(content: string): string {
	return content.replace(/^(\s*)##\s*Installation\s*\n/m, "");
}

/**
 * Remove Spacer components from MDX content
 * Removes all <Spacer /> components which are layout utilities not needed in processed docs
 */
export function removeSpacerComponents(content: string): string {
	return content.replace(/^(\s*)<Spacer\s*\/>\s*$/gm, "");
}

/**
 * Filter out unwanted MDX elements from the documentation content
 * This is the main function that orchestrates all filtering operations
 */
export function filterMdxContent(content: string): string {
	let filteredContent = content;

	// Remove the first import line (used for preprocessing)
	filteredContent = removeFirstImportLine(filteredContent);

	// Remove Installation header
	filteredContent = removeInstallationHeader(filteredContent);

	// Remove unwanted components
	filteredContent = removePackageManagersComponents(filteredContent);
	filteredContent = removeCarbonAdComponents(filteredContent);
	filteredContent = removeComponentLinksComponents(filteredContent);
	filteredContent = removeSpacerComponents(filteredContent);

	// Clean up SVG content
	filteredContent = cleanUpSvgTags(filteredContent);

	// Clean up whitespace
	filteredContent = cleanUpWhitespace(filteredContent);

	return filteredContent.trim();
}
