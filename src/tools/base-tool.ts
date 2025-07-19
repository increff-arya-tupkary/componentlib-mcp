/**
 * Abstract base class for MCP tools
 */

import type { ToolDefinition } from "@types";
import { type ZodRawShape, z } from "zod";

export abstract class BaseTool {
	abstract readonly name: string;
	abstract readonly title: string;
	abstract readonly description: string;
	abstract readonly inputSchema: ZodRawShape;

	/**
	 * Execute the tool with given parameters
	 */
	abstract execute(params: Record<string, unknown>): Promise<{
		content: Array<{ type: "text"; text: string }>;
	}>;

	/**
	 * Get tool definition for registration
	 */
	getDefinition(): ToolDefinition {
		return {
			name: this.name,
			description: {
				title: this.title,
				description: this.description,
				inputSchema: this.inputSchema,
			},
			handler: (params: Record<string, unknown>) => this.execute(params),
		};
	}

	/**
	 * Validate input parameters
	 */
	protected validateParams(params: Record<string, unknown>): void {
		const schema = z.object(this.inputSchema);
		const result = schema.safeParse(params);

		if (!result.success) {
			throw new Error(
				`Invalid parameters: ${JSON.stringify(result.error.issues)}`,
			);
		}
	}

	/**
	 * Create text content response
	 */
	protected createTextResponse(text: string): {
		content: Array<{ type: "text"; text: string }>;
	} {
		return {
			content: [{ type: "text", text }],
		};
	}
}
