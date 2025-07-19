import { BaseResource } from "@resources/base-resource.js";
import { ValidationError } from "@types";

export class GreetingResource extends BaseResource {
	readonly name = "greeting";
	readonly title = "Greeting Resource";
	readonly description = "Dynamic greeting generator";
	readonly uriTemplate = "greeting://{name}";
	readonly mimeType = "text/plain";

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
