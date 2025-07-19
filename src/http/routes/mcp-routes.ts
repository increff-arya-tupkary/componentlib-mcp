/**
 * HTTP route handlers for MCP endpoints
 */

import { randomUUID } from "node:crypto";
import type {
	HttpTransportConfig,
	ServerConfig,
} from "@config/server.config.js";
import {
	getRequestId,
	getSessionId,
	validateMcpRequest,
} from "@http/utils/request.utils.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { ServerDependencies, ServerFactory, SessionManager } from "@types";
import { handleError } from "@utils/errors.js";
import { logger } from "@utils/logger.js";
import type { Request, Response } from "express";

export class McpRouteHandlers {
	constructor(
		private readonly config: ServerConfig,
		private readonly sessionManager: SessionManager,
		private readonly serverFactory: ServerFactory,
		private readonly serverDependencies: ServerDependencies,
	) {}

	/**
	 * Handle POST requests for client-to-server communication
	 */
	async handlePost(req: Request, res: Response): Promise<void> {
		try {
			const requestId = getRequestId(req);
			const { isInitialize, sessionId } = validateMcpRequest(req);

			let transport: StreamableHTTPServerTransport;

			if (sessionId) {
				// Reuse existing transport
				const existingTransport = this.sessionManager.getTransport(sessionId);
				if (!existingTransport) {
					handleError(
						new Error(`Session not found: ${sessionId}`),
						res,
						requestId,
					);
					return;
				}
				transport = existingTransport;
				logger.debug(`Reusing transport for session: ${sessionId}`);
			} else if (isInitialize) {
				// Create new transport for initialization
				transport = await this.createNewTransport();
				logger.info(`Created new transport for initialization`);
			} else {
				handleError(
					new Error(
						"Invalid request: neither session continuation nor initialization",
					),
					res,
					requestId,
				);
				return;
			}

			// Handle the request through the transport
			await transport.handleRequest(req, res, req.body);
		} catch (error) {
			const requestId = getRequestId(req);
			handleError(error, res, requestId);
		}
	}

	/**
	 * Handle GET requests for server-to-client notifications via SSE
	 */
	async handleGet(req: Request, res: Response): Promise<void> {
		try {
			const sessionId = getSessionId(req);
			if (!sessionId) {
				handleError(new Error("Missing session ID for GET request"), res);
				return;
			}

			const transport = this.sessionManager.getTransport(sessionId);
			if (!transport) {
				handleError(new Error(`Session not found: ${sessionId}`), res);
				return;
			}

			logger.debug(`Handling SSE for session: ${sessionId}`);
			await transport.handleRequest(req, res);
		} catch (error) {
			handleError(error, res);
		}
	}

	/**
	 * Handle DELETE requests for session termination
	 */
	async handleDelete(req: Request, res: Response): Promise<void> {
		try {
			const sessionId = getSessionId(req);
			if (!sessionId) {
				handleError(new Error("Missing session ID for DELETE request"), res);
				return;
			}

			const transport = this.sessionManager.getTransport(sessionId);
			if (!transport) {
				handleError(new Error(`Session not found: ${sessionId}`), res);
				return;
			}

			logger.info(`Terminating session: ${sessionId}`);
			await transport.handleRequest(req, res);

			// Clean up session after handling the request
			this.sessionManager.removeTransport(sessionId);
		} catch (error) {
			handleError(error, res);
		}
	}

	/**
	 * Create new transport and MCP server connection
	 */
	private async createNewTransport(): Promise<StreamableHTTPServerTransport> {
		const transportConfig: HttpTransportConfig = {
			enableDnsRebindingProtection: this.config.enableDnsRebindingProtection,
			allowedHosts: this.config.allowedHosts,
			sessionIdGenerator: () => randomUUID(),
		};

		const transport = new StreamableHTTPServerTransport({
			...transportConfig,
			onsessioninitialized: (sessionId) => {
				this.sessionManager.setTransport(sessionId, transport);
				logger.info(`Session initialized: ${sessionId}`);
			},
		});

		// Set up cleanup when transport closes
		transport.onclose = () => {
			if (transport.sessionId) {
				this.sessionManager.removeTransport(transport.sessionId);
				logger.info(`Session closed: ${transport.sessionId}`);
			}
		};

		// Create and connect MCP server
		const server = this.serverFactory.createServer(this.serverDependencies);
		await server.connect(transport);

		return transport;
	}
}
