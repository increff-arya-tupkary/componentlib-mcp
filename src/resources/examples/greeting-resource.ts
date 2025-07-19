/**
 * Greeting 	async read(uri: URL, params: Record<string, string | string[]>): Promise<{
		contents: Array<{ uri: string; text: string }>;
	}> {
		this.validateParams(params, ["name"]);

		const name = Array.isArray(params.name) ? params.name[0] : String(params.name);

		// Basic validation for name parameter
		if (name.trim().length === 0) {
			throw new ValidationError("Name parameter cannot be empty");
		}

		// Sanitize name to prevent potential issues
		const sanitizedName = name.trim().replace(/[<>&"']/g, "");

		const greeting = `Hello, ${sanitizedName}!`;
		return this.createContentResponse(uri.href, greeting);
	}red from original main.ts
 */

import { ValidationError } from "../../types/index.js";
import { BaseResource } from "../base-resource.js";

export class GreetingResource extends BaseResource {
	readonly name = "greeting";
	readonly title = "Greeting Resource";
	readonly description = "Dynamic greeting generator";
	readonly uriTemplate = "greeting://{name}";

	async read(
		uri: URL,
		params: Record<string, string>,
	): Promise<{
		contents: Array<{ uri: string; text: string }>;
	}> {
		this.validateParams(params, ["name"]);

		const { name } = params;

		// Basic validation for name parameter
		if (name.trim().length === 0) {
			throw new ValidationError("Name parameter cannot be empty");
		}

		// Sanitize name to prevent potential issues
		const sanitizedName = name.trim().replace(/[<>&"']/g, "");

		const greeting = `Hello, ${sanitizedName}!`;
		return this.createContentResponse(uri.href, greeting);
	}
}
