/**
 * Factory for creating configured MCP servers
 */

import type { ServerConfig } from "@config/server.config.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerDependencies, ServerFactory } from "@types";
import { logger } from "@utils/logger.js";

export class McpServerFactory implements ServerFactory {
	constructor(private readonly config: ServerConfig) {}

	/**
	 * Create and configure MCP server with dependencies
	 */
	createServer(dependencies: ServerDependencies): McpServer {
		const server = new McpServer({
			name: this.config.name,
			version: this.config.version,
		});

		logger.info(
			`Creating MCP server: ${this.config.name} v${this.config.version}`,
		);

		// Register all tools from the tool registry
		const tools = dependencies.toolRegistry.getTools();
		for (const tool of tools) {
			logger.debug(`Registering tool: ${tool.name}`);
			server.registerTool(tool.name, tool.description, tool.handler);
		}

		// Register all resources from the resource registry
		const resources = dependencies.resourceRegistry.getResources();
		for (const resource of resources) {
			logger.debug(`Registering resource: ${resource.name}`);
			server.registerResource(
				resource.name,
				resource.template,
				resource.description,
				resource.handler,
			);
		}

		logger.info(
			`MCP server created with ${tools.length} tools and ${resources.length} resources`,
		);

		return server;
	}
}
