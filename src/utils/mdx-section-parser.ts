/**
 * MDX Section Parser Utilities
 *
 * This module provides utilities for parsing and extracting specific sections
 * from MDX documentation files. It can identify section boundaries using
 * markdown headers and extract content between sections while preserving
 * formatting.
 */

import { logger } from "@utils/logger.js";

/**
 * Represents a parsed section from MDX content
 */
export interface MdxSection {
	/** The header text without the # symbols */
	title: string;
	/** The original header level (1-6) */
	level: number;
	/** The full header line including # symbols */
	headerLine: string;
	/** The content of the section (everything until the next same-level or higher header) */
	content: string;
	/** Starting line number of the section (0-based) */
	startLine: number;
	/** Ending line number of the section (0-based) */
	endLine: number;
}

/**
 * Options for section matching
 */
export interface SectionMatchOptions {
	/** Whether to perform case-insensitive matching */
	caseInsensitive?: boolean;
	/** Whether to allow partial matches */
	partialMatch?: boolean;
	/** Whether to match exact section names only */
	exact?: boolean;
}

/**
 * Parse all sections from MDX content
 * @param content The MDX content to parse
 * @returns Array of parsed sections
 */
export function parseAllSections(content: string): MdxSection[] {
	const lines = content.split("\n");
	const sections: MdxSection[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

		if (headerMatch) {
			const level = headerMatch[1].length;
			const title = headerMatch[2].trim();
			const headerLine = line;

			// Find the end of this section (next header of same or higher level)
			let endLine = lines.length - 1;
			for (let j = i + 1; j < lines.length; j++) {
				const nextLine = lines[j];
				const nextHeaderMatch = nextLine.match(/^(#{1,6})\s+(.+)$/);

				if (nextHeaderMatch && nextHeaderMatch[1].length <= level) {
					endLine = j - 1;
					break;
				}
			}

			// Extract content (everything after the header line until the end of section)
			const contentLines = lines.slice(i + 1, endLine + 1);
			const content = contentLines.join("\n").trim();

			sections.push({
				title,
				level,
				headerLine,
				content,
				startLine: i,
				endLine,
			});
		}
	}

	return sections;
}

/**
 * Extract specific sections by name from MDX content
 * @param content The MDX content to parse
 * @param sectionNames Array of section names to extract
 * @param options Matching options
 * @returns Array of matching sections
 */
export function extractSections(
	content: string,
	sectionNames: string[],
	options: SectionMatchOptions = {},
): MdxSection[] {
	const allSections = parseAllSections(content);
	const matchedSections: MdxSection[] = [];

	for (const sectionName of sectionNames) {
		const matched = findSection(allSections, sectionName, options);
		if (matched) {
			matchedSections.push(matched);
		} else {
			logger.warn(`Section not found: ${sectionName}`);
		}
	}

	return matchedSections;
}

/**
 * Find a specific section by name
 * @param sections Array of parsed sections to search
 * @param sectionName Name of the section to find
 * @param options Matching options
 * @returns Found section or null
 */
export function findSection(
	sections: MdxSection[],
	sectionName: string,
	options: SectionMatchOptions = {},
): MdxSection | null {
	const {
		caseInsensitive = true,
		partialMatch = true,
		exact = false,
	} = options;

	// Normalize section name for comparison
	const normalizedTarget = caseInsensitive
		? sectionName.toLowerCase()
		: sectionName;

	for (const section of sections) {
		const normalizedTitle = caseInsensitive
			? section.title.toLowerCase()
			: section.title;

		let matches = false;

		if (exact) {
			// Exact match only
			matches = normalizedTitle === normalizedTarget;
		} else if (partialMatch) {
			// Partial match - section title contains the target or vice versa
			matches =
				normalizedTitle.includes(normalizedTarget) ||
				normalizedTarget.includes(normalizedTitle);
		} else {
			// Standard match
			matches = normalizedTitle === normalizedTarget;
		}

		if (matches) {
			return section;
		}
	}

	return null;
}

/**
 * Get sections by level (e.g., all h2 sections)
 * @param content The MDX content to parse
 * @param level The header level to filter by (1-6)
 * @returns Array of sections at the specified level
 */
export function getSectionsByLevel(
	content: string,
	level: number,
): MdxSection[] {
	const allSections = parseAllSections(content);
	return allSections.filter((section) => section.level === level);
}

/**
 * Check for common section name variations and aliases
 * @param sectionName The section name to normalize
 * @returns Array of possible section name variations
 */
export function getCommonSectionVariations(sectionName: string): string[] {
	const normalized = sectionName.toLowerCase().trim();
	const variations = new Set([normalized]);

	// Common aliases and variations
	const aliases: Record<string, string[]> = {
		api: ["api reference", "props", "properties", "parameters"],
		usage: ["example", "examples", "basic usage", "getting started"],
		installation: ["install", "setup"],
		import: ["imports", "importing"],
		accessibility: ["a11y", "accessibility features"],
		customization: ["custom styles", "styling", "theming"],
		variants: ["variations", "types"],
		props: ["properties", "api", "parameters"],
		events: ["event handlers", "callbacks"],
	};

	// Add direct aliases
	if (aliases[normalized]) {
		aliases[normalized].forEach((alias) => variations.add(alias));
	}

	// Add reverse aliases (if this is an alias, add the main term)
	for (const [main, aliasList] of Object.entries(aliases)) {
		if (aliasList.includes(normalized)) {
			variations.add(main);
		}
	}

	return Array.from(variations);
}

/**
 * Extract section content with its subsections
 * @param content The MDX content to parse
 * @param sectionName Name of the section to extract
 * @param includeSubsections Whether to include subsections
 * @param options Matching options
 * @returns The section content with header, or null if not found
 */
export function extractSectionWithSubsections(
	content: string,
	sectionName: string,
	includeSubsections: boolean = true,
	options: SectionMatchOptions = {},
): string | null {
	const sections = parseAllSections(content);
	const targetSection = findSection(sections, sectionName, options);

	if (!targetSection) {
		return null;
	}

	if (!includeSubsections) {
		// Return just the section header and direct content
		return `${targetSection.headerLine}\n\n${targetSection.content}`;
	}

	// Find all subsections that belong to this section
	const lines = content.split("\n");
	let endIndex = targetSection.endLine;

	// Look for the next section at the same level or higher
	for (let i = targetSection.startLine + 1; i < lines.length; i++) {
		const line = lines[i];
		const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

		if (headerMatch && headerMatch[1].length <= targetSection.level) {
			endIndex = i - 1;
			break;
		}
	}

	// Extract the full section including all subsections
	const fullSectionLines = lines.slice(targetSection.startLine, endIndex + 1);
	return fullSectionLines.join("\n").trim();
}
