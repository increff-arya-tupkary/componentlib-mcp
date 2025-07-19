/**
 * Tool registration and management
 */

import type { BaseTool } from "@tools/base-tool.js";
import type { ToolDefinition, ToolRegistry } from "@types";
import { logger } from "@utils/logger.js";

export class ToolRegistryImpl implements ToolRegistry {
	private tools: Map<string, ToolDefinition> = new Map();

	/**
	 * Register a tool from a tool class instance
	 */
	registerToolClass(tool: BaseTool): void {
		const definition = tool.getDefinition();
		this.registerTool(definition);
	}

	/**
	 * Register a tool definition
	 */
	registerTool(tool: ToolDefinition): void {
		if (this.tools.has(tool.name)) {
			logger.warn(`Tool '${tool.name}' is already registered. Overwriting.`);
		}
		this.tools.set(tool.name, tool);
		logger.debug(`Registered tool: ${tool.name}`);
	}

	/**
	 * Get all registered tools
	 */
	getTools(): ToolDefinition[] {
		return Array.from(this.tools.values());
	}

	/**
	 * Get a specific tool by name
	 */
	getTool(name: string): ToolDefinition | undefined {
		return this.tools.get(name);
	}

	/**
	 * Check if a tool is registered
	 */
	hasTool(name: string): boolean {
		return this.tools.has(name);
	}

	/**
	 * Get list of tool names
	 */
	getToolNames(): string[] {
		return Array.from(this.tools.keys());
	}

	/**
	 * Remove a tool
	 */
	removeTool(name: string): boolean {
		const removed = this.tools.delete(name);
		if (removed) {
			logger.debug(`Removed tool: ${name}`);
		}
		return removed;
	}

	/**
	 * Clear all tools
	 */
	clear(): void {
		this.tools.clear();
		logger.debug("Cleared all tools");
	}

	/**
	 * Get tool count
	 */
	getCount(): number {
		return this.tools.size;
	}
}
