/**
 * Unit tests for MDX Content Processing Utilities
 */

import { describe, expect, it } from "vitest";
import {
	cleanUpSvgTags,
	cleanUpWhitespace,
	filterMdxContent,
	removeCarbonAdComponents,
	removeComponentLinksComponents,
	removeFirstImportLine,
	removeInstallationHeader,
	removePackageManagersComponents,
	removeSpacerComponents,
} from "../../src/utils/mdx-processor.js";

describe("MDX Processor Utilities", () => {
	describe("removePackageManagersComponents", () => {
		it("should remove single-line PackageManagers component", () => {
			const input = [
				"# Button Component",
				"<PackageManagers commands={commands} />",
				"This is a button component.",
			].join("\n");

			const result = removePackageManagersComponents(input);
			const expected = [
				"# Button Component",
				"",
				"This is a button component.",
			].join("\n");

			expect(result).toBe(expected);
		});

		it("should remove multi-line PackageManagers component with attributes", () => {
			const input = [
				"# Button Component",
				"<PackageManagers ",
				"  commands={installCommands}",
				'  packageName="@heroui/button"',
				"/>",
				"This is a button component.",
			].join("\n");

			const result = removePackageManagersComponents(input);
			const expected = [
				"# Button Component",
				"",
				"This is a button component.",
			].join("\n");

			expect(result).toBe(expected);
		});

		it("should remove multiple PackageManagers components", () => {
			const input = [
				"<PackageManagers commands={commands1} />",
				"Some content here",
				"<PackageManagers ",
				"  commands={commands2}",
				'  packageName="test"',
				"/>",
				"More content",
			].join("\n");

			const result = removePackageManagersComponents(input);
			const expected = ["", "Some content here", "", "More content"].join("\n");

			expect(result).toBe(expected);
		});

		it("should handle content without PackageManagers components", () => {
			const input = [
				"# Button Component",
				"This is a button component without package managers.",
			].join("\n");

			const result = removePackageManagersComponents(input);
			expect(result).toBe(input);
		});
	});

	describe("removeCarbonAdComponents", () => {
		it("should remove CarbonAd component", () => {
			const input = [
				"# Component Documentation",
				"<CarbonAd />",
				"This is the component content.",
			].join("\n");

			const result = removeCarbonAdComponents(input);
			const expected = [
				"# Component Documentation",
				"",
				"This is the component content.",
			].join("\n");

			expect(result).toBe(expected);
		});

		it("should remove CarbonAd component with spaces", () => {
			const input = `<CarbonAd   />`;
			const result = removeCarbonAdComponents(input);
			expect(result).toBe("");
		});

		it("should remove multiple CarbonAd components", () => {
			const input = ["<CarbonAd />", "Content here", "<CarbonAd />"].join("\n");

			const result = removeCarbonAdComponents(input);
			const expected = ["", "Content here", ""].join("\n");

			expect(result).toBe(expected);
		});

		it("should handle content without CarbonAd components", () => {
			const input = ["# Component", "No ads here."].join("\n");

			const result = removeCarbonAdComponents(input);
			expect(result).toBe(input);
		});
	});

	describe("removeComponentLinksComponents", () => {
		it("should remove single-line ComponentLinks component", () => {
			const input = [
				"# Button",
				'<ComponentLinks component="button" />',
				"Button documentation.",
			].join("\n");

			const result = removeComponentLinksComponents(input);
			const expected = ["# Button", "", "Button documentation."].join("\n");

			expect(result).toBe(expected);
		});

		it("should remove multi-line ComponentLinks component", () => {
			const input = [
				"<ComponentLinks ",
				'  component="button"',
				"  storybook={true}",
				"/>",
			].join("\n");

			const result = removeComponentLinksComponents(input);
			expect(result).toBe("");
		});

		it("should remove ComponentLinks with complex attributes", () => {
			const input = `
				<ComponentLinks 
				  component="button"
				  storybook={true}
				  repository="https://github.com/heroui/heroui"
				  npm="@heroui/button"
				/>
			`.trim();

			const result = removeComponentLinksComponents(input);
			expect(result).toBe("");
		});

		it("should handle content without ComponentLinks", () => {
			const input = `
				# Button
				Button documentation without links.
			`.trim();

			const result = removeComponentLinksComponents(input);
			expect(result).toBe(input);
		});
	});

	describe("cleanUpWhitespace", () => {
		it("should replace multiple consecutive newlines with double newlines", () => {
			const input = `
				Line 1


				Line 2



				Line 3
			`.trim();

			const result = cleanUpWhitespace(input);
			const expected = `
				Line 1

				Line 2

				Line 3
			`.trim();

			expect(result).toBe(expected);
		});

		it("should handle newlines with spaces", () => {
			const input = `
				Line 1

				  
				   
				Line 2
			`.trim();

			const result = cleanUpWhitespace(input);
			const expected = `
				Line 1

				Line 2
			`.trim();

			expect(result).toBe(expected);
		});

		it("should preserve double newlines", () => {
			const input = `
				Line 1

				Line 2
			`.trim();

			const result = cleanUpWhitespace(input);
			expect(result).toBe(input);
		});

		it("should handle content without excessive whitespace", () => {
			const input = `
				Line 1
				Line 2
				Line 3
			`.trim();

			const result = cleanUpWhitespace(input);
			expect(result).toBe(input);
		});
	});

	describe("cleanUpSvgTags", () => {
		it("should remove content from SVG tags while preserving attributes", () => {
			const input = `
				<svg width="24" height="24" viewBox="0 0 24 24">
				  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
				  <circle cx="12" cy="12" r="3"/>
				</svg>
			`.trim();

			const result = cleanUpSvgTags(input);
			const expected = '<svg width="24" height="24" viewBox="0 0 24 24"></svg>';

			expect(result).toBe(expected);
		});

		it("should handle SVG without attributes", () => {
			const input = `
				<svg>
				  <path d="M12 2l3.09 6.26L22 9.27"/>
				</svg>
			`.trim();

			const result = cleanUpSvgTags(input);
			const expected = "<svg></svg>";

			expect(result).toBe(expected);
		});

		it("should handle multiple SVG tags", () => {
			const input = `
				<svg width="16" height="16">
				  <path d="M8 0"/>
				</svg>
				Some text
				<svg viewBox="0 0 24 24">
				  <circle cx="12" cy="12" r="10"/>
				</svg>
			`.trim();

			const result = cleanUpSvgTags(input);
			const expected = `
				<svg width="16" height="16"></svg>
				Some text
				<svg viewBox="0 0 24 24"></svg>
			`.trim();

			expect(result).toBe(expected);
		});

		it("should handle content without SVG tags", () => {
			const input = `
				# Component
				This has no SVG content.
			`.trim();

			const result = cleanUpSvgTags(input);
			expect(result).toBe(input);
		});
	});

	describe("removeFirstImportLine", () => {
		it("should remove first import line from @/content path", () => {
			const input = `
				import {buttonContent} from "@/content/components/button";
				import React from "react";

				# Button Component
				This is a button.
			`.trim();

			const result = removeFirstImportLine(input);
			const expected = `
				import React from "react";

				# Button Component
				This is a button.
			`.trim();

			expect(result).toBe(expected);
		});

		it("should remove import with multiple named imports", () => {
			const input = `
				import {buttonContent, buttonProps, buttonUsage} from "@/content/components/button";
				# Button Component
			`.trim();

			const result = removeFirstImportLine(input);
			const expected = `
				# Button Component
			`.trim();

			expect(result).toBe(expected);
		});

		it("should remove import with single quotes", () => {
			const input = `
				import {content} from '@/content/components/input';
				# Input Component
			`.trim();

			const result = removeFirstImportLine(input);
			const expected = `
				# Input Component
			`.trim();

			expect(result).toBe(expected);
		});

		it("should not remove imports from other paths", () => {
			const input = [
				'import React from "react"',
				'import { buttonContent } from "@/content/components/button";',
				"# Button Component",
			].join("\n");

			const result = removeFirstImportLine(input);
			const expected = ['import React from "react"', "# Button Component"].join(
				"\n",
			);

			expect(result).toBe(expected);
		});

		it("should handle content without matching imports", () => {
			const input = [
				'import React from "react";',
				'import {Button} from "@heroui/button";',
				"# Button Component",
			].join("\n");

			const result = removeFirstImportLine(input);
			expect(result).toBe(input);
		});

		it("should handle empty content", () => {
			const input = "";
			const result = removeFirstImportLine(input);
			expect(result).toBe("");
		});
	});

	describe("removeInstallationHeader", () => {
		it("should remove Installation header", () => {
			const input = `
				# Button Component

				## Installation

				## Usage
				Use the button component like this.
			`.trim();

			const result = removeInstallationHeader(input);
			const expected = `
				# Button Component
				## Usage
				Use the button component like this.
			`.trim();

			expect(result).toBe(expected);
		});

		it("should remove Installation header with extra spaces", () => {
			const input = ["##   Installation   ", "Content here."].join("\n");

			const result = removeInstallationHeader(input);
			const expected = ["Content here."].join("\n");

			expect(result).toBe(expected);
		});

		it("should handle content without Installation header", () => {
			const input = `
				# Component
				## Usage
				Use it like this.
			`.trim();

			const result = removeInstallationHeader(input);
			expect(result).toBe(input);
		});

		it("should only remove the first Installation header", () => {
			const input = [
				"## Installation",
				"First installation section.",
				"## Installation",
				"Second installation section.",
			].join("\n");

			const result = removeInstallationHeader(input);
			const expected = [
				"First installation section.",
				"## Installation",
				"Second installation section.",
			].join("\n");

			expect(result).toBe(expected);
		});
	});

	describe("removeSpacerComponents", () => {
		it("should remove Spacer component", () => {
			const input = ["# Component", "<Spacer />", "Some content here."].join(
				"\n",
			);

			const result = removeSpacerComponents(input);
			const expected = ["# Component", "", "Some content here."].join("\n");

			expect(result).toBe(expected);
		});

		it("should remove Spacer component with spaces", () => {
			const input = `<Spacer   />`;
			const result = removeSpacerComponents(input);
			expect(result).toBe("");
		});

		it("should remove multiple Spacer components", () => {
			const input = `
				Content 1
				<Spacer />
				Content 2
				<Spacer />
				Content 3
			`.trim();

			const result = removeSpacerComponents(input);
			const expected = `
				Content 1

				Content 2

				Content 3
			`.trim();

			expect(result).toBe(expected);
		});

		it("should handle content without Spacer components", () => {
			const input = `
				# Component
				No spacers here.
			`.trim();

			const result = removeSpacerComponents(input);
			expect(result).toBe(input);
		});
	});

	describe("filterMdxContent", () => {
		it("should apply all filters in sequence", () => {
			const input = `
				import {buttonContent} from "@/content/components/button";

				# Button Component

				## Installation

				<PackageManagers commands={commands} />

				<CarbonAd />

				<ComponentLinks component="button" />

				<Spacer />

				## Usage

				<svg width="24" height="24">
				  <path d="M12 2"/>
				</svg>

				Use the button component.



				More content here.
			`.trim();

			const result = filterMdxContent(input);
			const expected = `
				# Button Component

				## Usage

				<svg width="24" height="24"></svg>

				Use the button component.

				More content here.
			`.trim();

			expect(result).toBe(expected);
		});

		it("should handle empty content", () => {
			const result = filterMdxContent("");
			expect(result).toBe("");
		});

		it("should handle content with no filterable elements", () => {
			const input = `
				# Clean Component

				This is clean content with no unwanted elements.

				## Usage

				Just use it normally.
			`.trim();

			const result = filterMdxContent(input);
			expect(result).toBe(input);
		});

		it("should preserve markdown structure", () => {
			const input = `
				import {content} from "@/content/components/test";
				# Component

				- List item 1
				- List item 2

				> Blockquote

				\`\`\`typescript
				const example = "code";
				\`\`\`

				<Spacer />

				## Section

				Normal text.
			`.trim();

			const result = filterMdxContent(input);
			const expected = `
				# Component

				- List item 1
				- List item 2

				> Blockquote

				\`\`\`typescript
				const example = "code";
				\`\`\`

				## Section

				Normal text.
			`.trim();

			expect(result).toBe(expected);
		});

		it("should handle complex real-world example", () => {
			const input = `
				import {buttonContent} from "@/content/components/button";

				# Button Component

				The Button component allows users to take actions.

				## Installation

				<PackageManagers commands={{
				  npm: "npm install @heroui/button",
				  yarn: "yarn add @heroui/button",
				  pnpm: "pnpm add @heroui/button"
				}} />

				<CarbonAd />

				<ComponentLinks 
				  component="button"
				  storybook={true}
				  repository="https://github.com/heroui/heroui"
				/>

				<Spacer />

				## Usage

				<svg width="24" height="24" viewBox="0 0 24 24">
				  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
				</svg>

				Import the component and use it in your application.



				### Basic Usage

				Here's how to use the button.
			`.trim();

			const result = filterMdxContent(input);
			const expected = `
				# Button Component

				The Button component allows users to take actions.

				## Usage

				<svg width="24" height="24" viewBox="0 0 24 24"></svg>

				Import the component and use it in your application.

				### Basic Usage

				Here's how to use the button.
			`.trim();

			expect(result).toBe(expected);
		});
	});

	describe("Edge Cases", () => {
		it("should handle malformed components gracefully", () => {
			const input = `
				<PackageManagers
				<CarbonAd
				<ComponentLinks component="test"
				<Spacer
			`.trim();

			// Should not crash, even with malformed components
			const result = filterMdxContent(input);
			expect(typeof result).toBe("string");
		});

		it("should handle nested components", () => {
			const input = `
				<div>
				  <PackageManagers commands={commands} />
				  <span><CarbonAd /></span>
				</div>
			`.trim();

			const result = filterMdxContent(input);
			const expected = `
				<div>
				  
				  <span></span>
				</div>
			`.trim();

			expect(result).toBe(expected);
		});

		it("should handle components with special characters in attributes", () => {
			const input = `
				<PackageManagers commands={{
				  "npm": "npm install @heroui/button",
				  "special": "test with 'quotes' and \"double quotes\""
				}} />
			`.trim();

			const result = removePackageManagersComponents(input);
			expect(result).toBe("");
		});

		it("should handle very large content efficiently", () => {
			const largeContent =
				"# Large Content\n".repeat(1000) +
				"<PackageManagers commands={commands} />\n" +
				"Content line\n".repeat(1000);

			const result = filterMdxContent(largeContent);
			expect(result).not.toContain("PackageManagers");
			expect(result.length).toBeLessThan(largeContent.length);
		});
	});
});
