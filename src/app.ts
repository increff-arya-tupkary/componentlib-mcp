/**
 * Application setup and configuration for HeroUI MCP Server
 */

import type { Server } from "node:http";
import type { ServerConfig } from "@config/server.config.js";
import { defaultServerConfig } from "@config/server.config.js";
import {
	addCorsHeaders,
	logRequest,
	validateJsonContent,
} from "@http/middleware/session.middleware.js";
import { McpRouteHandlers } from "@http/routes/mcp-routes.js";
import { GreetingResource } from "@resources/examples/greeting-resource.js";
import { ResourceRegistryImpl } from "@resources/registry.js";
import { McpServerFactory } from "@server/mcp-server.factory.js";
import { ListComponentsTool } from "@tools/components/list-components";
import { ToolRegistryImpl } from "@tools/registry.js";
import { SessionTransportManager } from "@transport/session-manager.js";
import type { Application, ServerDependencies } from "@types";
import { asyncHandler } from "@utils/errors.js";
import { logger } from "@utils/logger.js";
import type { Express } from "express";
import express from "express";

export class HeroUiMcpApplication implements Application {
	private app: Express;
	private server: Server | null = null;
	private sessionManager: SessionTransportManager;
	private routeHandlers!: McpRouteHandlers;

	constructor(private readonly config: ServerConfig = defaultServerConfig) {
		this.app = express();
		this.sessionManager = new SessionTransportManager();
		this.setupApplication();
	}

	/**
	 * Start the application
	 */
	async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this.server = this.app.listen(this.config.port, () => {
					logger.info(`HeroUI MCP Server running on port ${this.config.port}`);
					logger.info(
						`Server name: ${this.config.name} v${this.config.version}`,
					);
					resolve();
				});

				this.server.on("error", (error: Error) => {
					logger.error("Server error:", error);
					reject(error);
				});
			} catch (error) {
				logger.error("Failed to start server:", error);
				reject(error);
			}
		});
	}

	/**
	 * Stop the application
	 */
	async stop(): Promise<void> {
		return new Promise((resolve) => {
			if (this.server) {
				this.server.close(() => {
					logger.info("Server stopped");
					resolve();
				});
			} else {
				resolve();
			}

			// Clean up session manager
			this.sessionManager.shutdown();
		});
	}

	/**
	 * Set up Express application with middleware and routes
	 */
	private setupApplication(): void {
		// Basic middleware
		this.app.use(express.json());
		this.app.use(logRequest);
		this.app.use(addCorsHeaders);
		this.app.use(validateJsonContent);

		// Create dependencies
		const dependencies = this.createDependencies();

		// Create route handlers
		const serverFactory = new McpServerFactory(this.config);
		this.routeHandlers = new McpRouteHandlers(
			this.config,
			this.sessionManager,
			serverFactory,
			dependencies,
		);

		// Set up routes
		this.setupRoutes();

		// Error handling
		this.setupErrorHandling();

		logger.info("Application setup complete");
	}

	/**
	 * Create server dependencies with registered tools and resources
	 */
	private createDependencies(): ServerDependencies {
		const toolRegistry = new ToolRegistryImpl();
		const resourceRegistry = new ResourceRegistryImpl();

		// Register default tools
		toolRegistry.registerToolClass(new ListComponentsTool());

		// Register default resources
		resourceRegistry.registerResourceClass(new GreetingResource());

		logger.info(
			`Registered ${toolRegistry.getCount()} tools and ${resourceRegistry.getCount()} resources`,
		);

		return {
			toolRegistry,
			resourceRegistry,
			sessionManager: this.sessionManager,
		};
	}

	/**
	 * Set up HTTP routes
	 */
	private setupRoutes(): void {
		// Health check endpoint
		this.app.get("/health", (_req, res) => {
			res.json({
				status: "healthy",
				name: this.config.name,
				version: this.config.version,
				timestamp: new Date().toISOString(),
				sessions: this.sessionManager.getSessionCount(),
			});
		});

		// Main MCP endpoints
		this.app.post(
			"/mcp",
			asyncHandler(this.routeHandlers.handlePost.bind(this.routeHandlers)),
		);
		this.app.get(
			"/mcp",
			asyncHandler(this.routeHandlers.handleGet.bind(this.routeHandlers)),
		);
		this.app.delete(
			"/mcp",
			asyncHandler(this.routeHandlers.handleDelete.bind(this.routeHandlers)),
		);

		// Catch-all for unsupported routes
		this.app.use((req, res) => {
			res.status(404).json({
				error: "Not Found",
				message: `Route ${req.method} ${req.originalUrl} not found`,
			});
		});

		logger.debug("Routes configured");
	}

	/**
	 * Set up global error handling
	 */
	private setupErrorHandling(): void {
		// Global error handler
		this.app.use(
			(
				error: Error,
				_req: express.Request,
				res: express.Response,
				next: express.NextFunction,
			) => {
				logger.error("Unhandled application error:", error);

				if (res.headersSent) {
					return next(error);
				}

				res.status(500).json({
					jsonrpc: "2.0",
					error: {
						code: -32603,
						message: "Internal server error",
					},
					id: null,
				});
			},
		);

		logger.debug("Error handling configured");
	}

	/**
	 * Get application instance (for testing)
	 */
	getApp(): Express {
		return this.app;
	}

	/**
	 * Get session manager (for testing)
	 */
	getSessionManager(): SessionTransportManager {
		return this.sessionManager;
	}
}
