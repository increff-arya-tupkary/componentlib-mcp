/**
 * Abstract base class for MCP resources
 */

import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ResourceDefinition } from "@types";

export abstract class BaseResource {
	abstract readonly name: string;
	abstract readonly title: string;
	abstract readonly description: string;
	abstract readonly uriTemplate: string;

	/**
	 * Read the resource with given URI and parameters
	 */
	abstract read(
		uri: URL,
		params: Record<string, string | string[]>,
	): Promise<{
		contents: Array<{ uri: string; text: string }>;
	}>;

	/**
	 * Get resource definition for registration
	 */
	getDefinition(): ResourceDefinition {
		return {
			name: this.name,
			template: new ResourceTemplate(this.uriTemplate, { list: undefined }),
			description: {
				title: this.title,
				description: this.description,
			},
			handler: (uri: URL, params: Record<string, string | string[]>) =>
				this.read(uri, params),
		};
	}

	/**
	 * Validate input parameters
	 */
	protected validateParams(
		params: Record<string, string | string[]>,
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
	 * Create content response
	 */
	protected createContentResponse(
		uri: string,
		text: string,
	): {
		contents: Array<{ uri: string; text: string }>;
	} {
		return {
			contents: [{ uri, text }],
		};
	}
}
