import { BaseTool } from "@tools/base-tool.js";

interface ApiContent {
	name: string;
	type: "file" | "dir";
}

export class ListComponentsTool extends BaseTool {
	readonly name = "list_components";
	readonly title = "List Components Tool";
	readonly description = "List all heroui components";
	readonly inputSchema = {};

	async execute(_params: Record<string, unknown>): Promise<{
		content: Array<{ type: "text"; text: string }>;
	}> {
		try {
			const apiUrl =
				"https://api.github.com/repos/heroui-inc/heroui/contents/packages/components?ref=canary";

			const response = await fetch(apiUrl, {
				headers: {
					Accept: "application/vnd.github.v3+json",
					"User-Agent": "heroui-mcp-client",
				},
			});

			if (!response.ok) {
				throw new Error(
					`GitHub API error: ${response.status} ${response.statusText}`,
				);
			}

			const contents = (await response.json()) as ApiContent[];

			const components = contents
				.filter((item) => item.type === "dir")
				.map((item) => item.name)
				.sort();

			const componentList = components.join("\n- ");

			return {
				content: [
					{
						type: "text",
						text: `HeroUI Components found:\n\n- ${componentList}\n\nTotal: ${components.length} components`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error fetching components: ${error instanceof Error ? error.message : "Unknown error"}`,
					},
				],
			};
		}
	}
}
