/**
 * Abstract base class for MCP tools
 */

import type { ToolDefinition } from "@types";
import type { ZodRawShape } from "zod";

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
	protected validateParams(
		params: Record<string, unknown>,
		required: string[],
	): void {
		for (const param of required) {
			if (
				!(param in params) ||
				params[param] === undefined ||
				params[param] === ""
			) {
				throw new Error(`Missing required parameter: ${param}`);
			}
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
