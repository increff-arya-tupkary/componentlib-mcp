import { BaseTool } from "@tools/base-tool.js";
import { ValidationError } from "@types";
import { z } from "zod";

export class AddTool extends BaseTool {
	readonly name = "add";
	readonly title = "Addition Tool";
	readonly description = "Add two numbers";
	readonly inputSchema = {
		a: z.string().describe("First number"),
		b: z.string().describe("Second number"),
	};

	async execute(params: Record<string, unknown>): Promise<{
		content: Array<{ type: "text"; text: string }>;
	}> {
		this.validateParams(params);

		const a = String(params.a);
		const b = String(params.b);

		// Validate that inputs are valid numbers
		const numA = Number.parseInt(a, 10);
		const numB = Number.parseInt(b, 10);

		if (Number.isNaN(numA)) {
			throw new ValidationError(`Invalid number for parameter 'a': ${a}`);
		}

		if (Number.isNaN(numB)) {
			throw new ValidationError(`Invalid number for parameter 'b': ${b}`);
		}

		const result = numA + numB;
		return this.createTextResponse(String(result));
	}
}
